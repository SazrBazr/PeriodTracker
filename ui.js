// ui.js
import {getCycleHistory, getSymptomsHistory} from './firestore.js';
import { auth } from './firebaseConfig.js';
import { predictNextPeriod, calculateCycleStats, getCurrentCyclePhase, getNutritionTips } from './utils.js';

export function showDashboard(userData) {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('username').textContent = userData.username;
    document.body.classList.add(userData.gender);
}

export function showAuth() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

export function renderCycleHistory(cycles) {
    const cycleHistory = document.getElementById('cycle-history');
    cycleHistory.innerHTML = '';
    let counter = 0;
    cycles.forEach(cycle => {
        counter++;
        if(counter >= 4){
            return;
        }
        const li = document.createElement('li');
        const startString = new Date(cycle.startDate).toISOString().split('T')[0]
        const endString = new Date(cycle.endDate).toISOString().split('T')[0]
        li.innerHTML = `
            <strong>Start:</strong> ${startString},<br> <strong>End:</strong> ${endString}<br>
        `;
        cycleHistory.appendChild(li);

    });
}

export function renderSymptomsHistory(symptoms) {
    const symptomsHistory = document.getElementById('symptoms-history');
    symptomsHistory.innerHTML = '';
    let counter = 0;
    symptoms.forEach(symptom => {
        counter++;
        if(counter >= 4){
            return;
        }
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>Date:</strong> ${symptom.date|| 'None'}<br>
            <strong>Symptoms:</strong> ${symptom.symptoms?.join(', ') || 'None'}<br>
            <strong>Flow:</strong> ${symptom.flow || 'Not specified'}
        `;
        symptomsHistory.appendChild(li);

    });
}

export async function updateUi(){
    const user = auth.currentUser;
    if (!user) return;
    const cycles = await getCycleHistory(user.uid);
    const symptoms = await getSymptomsHistory(user.uid);


    renderCycleHistory(cycles);
    renderSymptomsHistory(symptoms);
    showPrediction(predictNextPeriod(cycles));
    showCycleStats(calculateCycleStats(cycles));
    showNutritionTips(getNutritionTips(getCurrentCyclePhase(cycles)));
    setInterval(async () => {
        renderCycleHistory(cycles);
        renderSymptomsHistory(symptoms);
        showPrediction(predictNextPeriod(cycles));
        showCycleStats(calculateCycleStats(cycles));
        showNutritionTips(getNutritionTips(getCurrentCyclePhase(cycles)));
    }, 10000);
}

export function renderInvitations(invitations) {
    const invitationsList = document.getElementById('invitations-list');
    invitationsList.innerHTML = '';
    invitations.forEach(invitation => {
        const li = document.createElement('li');
        li.innerHTML = `
            Invitation from: ${invitation.fromUserId}
            <button class="accept-btn" data-invitation-id="${invitation.id}">Accept</button>
            <button class="reject-btn" data-invitation-id="${invitation.id}">Reject</button>
        `;
        invitationsList.appendChild(li);
    });
}

export function showPrediction(prediction) {
    document.getElementById('days-until-period').textContent = prediction;
}

export function showCycleStats(stats) {
    document.getElementById('avg-cycle-length-stat').textContent = stats.avgCycleLength;
    document.getElementById('avg-period-length-stat').textContent = stats.avgPeriodLength;
    document.getElementById('ovulation-window-stat').textContent = stats.ovulationWindow;
    document.getElementById('fertile-days-stat').textContent = stats.fertileDays;
}

export function showNutritionTips(tips) {
    document.getElementById('nutrition-tips-content').textContent = tips;
}