// firestore.js
import { db } from './firebaseConfig.js';
import { collection, query, orderBy, getDocs, getDoc, addDoc, doc, setDoc, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

export async function getUserData(uid) {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.data();
}

export async function setUserData(uid, data) {
    await setDoc(doc(db, 'users', uid), data);
}

export async function addCycleData(uid, data) {
    await addDoc(collection(db, 'users', uid, 'cycles'), data);
}

export async function addSymptomData(uid, data) {
    await addDoc(collection(db, 'users', uid, 'symptoms'), data);
}

export async function getCycleHistory(uid) {
    if (!uid) {
        console.error("UID is undefined.");
        return [];
    }
    const cyclesQuery = query(collection(db, 'users', uid, 'cycles'), orderBy('startDate', 'desc'));
    const querySnapshot = await getDocs(cyclesQuery);
    return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        ref: doc.ref // Save reference to update document later
    }));
}

export async function getCycleHistoryWithId(uid) {
    const cyclesQuery = query(collection(db, 'users', uid, 'cycles'), orderBy('startDate', 'desc'));
    const querySnapshot = await getDocs(cyclesQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Include document ID
}

export async function getSymptomsHistory(uid) {
    const symptomsQuery = query(collection(db, 'users', uid, 'symptoms'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(symptomsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUserIdByEmail(email) {
    const usersQuery = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(usersQuery);
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
    } else {
        throw new Error('User not found in Firestore.');
    }
}

export async function sendInvitation(fromUserId, toUserId) {
    await addDoc(collection(db, 'invitations'), {
        fromUserId,
        toUserId,
        status: 'pending',
        timestamp: new Date()
    });
}

export async function updateInvitationStatus(invitationId, status) {
    await updateDoc(doc(db, 'invitations', invitationId), { status });
}

export async function updateUserPartner(uid, partnerId) {
    await updateDoc(doc(db, 'users', uid), { partner: partnerId });
}

export async function getPendingInvitations(userId) {
    const invitationsQuery = query(collection(db, 'invitations'), where('toUserId', '==', userId), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(invitationsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}