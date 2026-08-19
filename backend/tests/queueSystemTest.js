import mongoose from "mongoose";
import dotenv from "dotenv";
import LiveSessionModel from "../App/models/liveSession.js";
import QueueEntryModel from "../App/models/queueEntry.js";
import OrganizationModel from "../App/models/organization.js";
import {
  joinQueue,
  leaveQueue,
  getQueue,
  admitParticipant,
  startConsultation,
  endConsultation,
  getNextParticipant,
  rejectParticipant,
  toggleQueuePause,
  recalculateQueue,
  getSessionAnalytics,
} from "../services/queueService.js";
import { getVideoProvider } from "../services/videoProvider.js";

dotenv.config({ path: ".env" });

async function runQueueSystemTests() {
  console.log("==================================================");
  console.log("🧪 STARTING TEAM CALL + WAITING QUEUE SYSTEM TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const createdOrgIds = [];

  try {
    const mongoUri = process.env.DB_URL || "mongodb://localhost:27017/RBF";
    await mongoose.connect(mongoUri, { dbName: "RBF" });
    console.log(" Connected to MongoDB for test execution");

    // Helper to create test organization
    async function createTestOrg(name, email) {
      const org = await OrganizationModel.create({
        company_type: "mentor",
        company_name: `${name} Corp`,
        name,
        email,
        phone: "1234567890",
        role: "normal",
        sessions: [{ token: `test_token_${Date.now()}_${Math.random()}` }],
      });
      createdOrgIds.push(org._id);
      return org;
    }

    const hostOrg = await createTestOrg("Dr. Host", `host_${Date.now()}@test.com`);
    const user1Org = await createTestOrg("Rahul Sharma", `rahul_${Date.now()}@test.com`);
    const user2Org = await createTestOrg("Amit Kumar", `amit_${Date.now()}@test.com`);
    const user3Org = await createTestOrg("Priya Gupta", `priya_${Date.now()}@test.com`);
    const user4Org = await createTestOrg("Neha Singh", `neha_${Date.now()}@test.com`);

    console.log("\n[Test Suite 1: Session Creation & Lifecycle]");
    const session = await LiveSessionModel.create({
      hostId: hostOrg._id,
      title: "Test Live Consultation Session",
      description: "Testing Queue & Call System",
      status: "SCHEDULED",
      maxQueueSize: 3,
      maxConsultationDuration: 15,
      averageConsultationDuration: 10,
      autoNextParticipant: true,
      videoProvider: "in-built-webrtc",
      videoRoomId: `test_room_${Date.now()}`,
    });

    assert(session._id && session.status === "SCHEDULED", "Session created in SCHEDULED state");

    // 2. Joining queue when not LIVE should fail
    try {
      await joinQueue(session._id, user1Org._id);
      assert(false, "Should reject queue join when session is not LIVE");
    } catch (err) {
      assert(err.message.includes("not started"), "Correctly rejected queue join on non-LIVE session");
    }

    // 3. Start Session
    session.status = "LIVE";
    session.startedAt = new Date();
    await session.save();
    assert(session.status === "LIVE", "Session transitioned to LIVE");

    console.log("\n[Test Suite 2: Queue FIFO Ordering & Positions]");
    // User 1 joins
    const join1 = await joinQueue(session._id, user1Org._id);
    assert(join1.position === 1 && join1.estimatedWaitTime === 0, "User 1 joins at position #1 with 0m wait");

    // User 2 joins
    const join2 = await joinQueue(session._id, user2Org._id);
    assert(join2.position === 2 && join2.estimatedWaitTime === 10, "User 2 joins at position #2 with 10m estimated wait");

    // User 3 joins
    const join3 = await joinQueue(session._id, user3Org._id);
    assert(join3.position === 3 && join3.estimatedWaitTime === 20, "User 3 joins at position #3 with 20m estimated wait");

    // Duplicate join test
    const dupJoin = await joinQueue(session._id, user2Org._id);
    assert(dupJoin.alreadyInQueue === true && dupJoin.position === 2, "Duplicate join prevented and returns existing position");

    // Max capacity test (maxQueueSize = 3, user 4 should be rejected)
    try {
      await joinQueue(session._id, user4Org._id);
      assert(false, "Should reject when queue exceeds maxQueueSize");
    } catch (err) {
      assert(err.message.includes("full"), "Correctly rejected join when queue capacity is reached");
    }

    console.log("\n[Test Suite 3: User Leaves Queue & Automatic Re-ranking]");
    // User 2 leaves the queue
    const leaveResult = await leaveQueue(session._id, user2Org._id, "User cancelled");
    assert(leaveResult.success === true, "User 2 left queue successfully");

    // Check that User 3 is now position #2 with 10m wait time
    const updatedQueue = await getQueue(session._id);
    assert(updatedQueue.length === 2, "Waiting queue length is now 2");
    assert(
      String(updatedQueue[0].userId._id || updatedQueue[0].userId) === String(user1Org._id) && updatedQueue[0].position === 1,
      "User 1 remains at position #1"
    );
    assert(
      String(updatedQueue[1].userId._id || updatedQueue[1].userId) === String(user3Org._id) &&
        updatedQueue[1].position === 2 &&
        updatedQueue[1].estimatedWaitTime === 10,
      "User 3 moved up from position #3 to position #2 in real time"
    );

    console.log("\n[Test Suite 4: Host Admission & Video Access Control]");
    const entryToAdmit = updatedQueue[0];
    const admitResult = await admitParticipant(session._id, hostOrg._id, entryToAdmit._id);
    assert(admitResult.success === true && admitResult.entry.status === "ADMITTED", "Host successfully admitted User 1");

    // Verify video provider access grant
    const videoProvider = getVideoProvider(session.videoProvider);
    const hostGrant = await videoProvider.generateAccessGrant(session, hostOrg, null);
    assert(hostGrant.authorized === true && hostGrant.isHost === true, "Host has authorized call access");

    const admittedUserGrant = await videoProvider.generateAccessGrant(session, user1Org, admitResult.entry);
    assert(admittedUserGrant.authorized === true, "Admitted user has authorized call access grant");

    const unauthorizedGrant = await videoProvider.generateAccessGrant(session, user3Org, updatedQueue[1]);
    assert(unauthorizedGrant.authorized === false, "Waiting user (not admitted) is denied call access");

    console.log("\n[Test Suite 5: Consultation Lifecycle & Auto-Next Participant]");
    // Start consultation for User 1
    const startResult = await startConsultation(session._id, user1Org._id);
    assert(startResult.entry.status === "IN_CALL", "Consultation started and marked IN_CALL");

    // End consultation for User 1 -> Since autoNextParticipant = true, User 3 should automatically be admitted!
    const endResult = await endConsultation(session._id, hostOrg._id, admitResult.entry._id);
    assert(endResult.success === true && endResult.completedEntry.status === "COMPLETED", "Consultation ended and marked COMPLETED");
    assert(endResult.autoNextTriggered === true && endResult.nextParticipant !== null, "Auto-Next automatically triggered admission for next waiting participant");
    assert(String(endResult.nextParticipant.userId._id || endResult.nextParticipant.userId) === String(user3Org._id), "User 3 was automatically admitted via Auto-Next");

    console.log("\n[Test Suite 6: Session Analytics]");
    const analytics = await getSessionAnalytics(session._id);
    assert(analytics.analytics.totalCompleted === 1, "Analytics correctly records 1 completed consultation");
    assert(analytics.analytics.totalCancelled === 1, "Analytics correctly records 1 cancelled queue entry");
    assert(analytics.analytics.totalJoined >= 3, "Analytics correctly records total joined users");

    // Cleanup test data
    await QueueEntryModel.deleteMany({ sessionId: session._id });
    await LiveSessionModel.findByIdAndDelete(session._id);
    await OrganizationModel.deleteMany({ _id: { $in: createdOrgIds } });
    console.log("\n🧹 Cleaned up test session, queue entries, and test orgs");

    console.log("\n==================================================");
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");
  } catch (testErr) {
    console.error("❌ Test suite encountered fatal error:", testErr);
    failed++;
  } finally {
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runQueueSystemTests();
