import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, fetchSignInMethodsForEmail, signOut } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  getDoc,
  addDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  where
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const signupEmail = document.getElementById('signup-email');
    const signupUsername = document.getElementById('signup-username');
    const signupPassword = document.getElementById('signup-password');
    const signupConfirmPassword = document.getElementById('signup-confirm-password');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const dashboard = document.getElementById('dashboard');
    const authContainer = document.getElementById('auth-container');
    const periodStartInput = document.getElementById('period-start');
    const periodEndInput = document.getElementById('period-end');
    const savePeriodBtn = document.getElementById('save-period-btn');
    const cycleHistory = document.getElementById('cycle-history');
    const usernameSpan = document.getElementById('username');
    const loading = document.getElementById('loading');
    const nextPeriod = document.getElementById('next-period-prediction');
    const logoutBtn = document.getElementById('logout-btn');
    const shareEmailInput = document.getElementById('invite-email');
    const sendInvitationBtn = document.getElementById('invite-btn');
    const invitationsList = document.getElementById('invitations-list');
    const startEndPeriodBtn = document.getElementById('start-end-period-btn');
    const logSymptomsBtn = document.getElementById('log-symptoms-btn');
    const symptomsModal = document.getElementById('symptoms-modal');
    const saveSymptomsBtn = document.getElementById('save-symptoms-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');

    let isDashboardShown = false; // Track if the dashboard has been shown
    let isPeriodActive = false; // Track if a period is active

    // DOM Elements
    const dashboardTabBtn = document.getElementById('dashboard-tab-btn');
    const trackingTabBtn = document.getElementById('tracking-tab-btn');
    const statsTabBtn = document.getElementById('stats-tab-btn');

    const dashboardTab = document.getElementById('dashboard-tab');
    const trackingTab = document.getElementById('tracking-tab');
    const statsTab = document.getElementById('stats-tab');

    // Switch to Dashboard Tab
    dashboardTabBtn.addEventListener('click', () => {
        setActiveTab(dashboardTabBtn, dashboardTab);
    });

    // Switch to Tracking Tab
    trackingTabBtn.addEventListener('click', () => {
        setActiveTab(trackingTabBtn, trackingTab);
        renderCalendar(); // Render the calendar when the tracking tab is opened
    });

    // Switch to Stats Tab
    statsTabBtn.addEventListener('click', () => {
        setActiveTab(statsTabBtn, statsTab);
    });

    // Function to set the active tab
    function setActiveTab(button, tab) {
        // Remove active class from all buttons and tabs
        dashboardTabBtn.classList.remove('active');
        trackingTabBtn.classList.remove('active');
        statsTabBtn.classList.remove('active');

        dashboardTab.classList.remove('active');
        trackingTab.classList.remove('active');
        statsTab.classList.remove('active');

        // Add active class to the selected button and tab
        button.classList.add('active');
        tab.classList.add('active');
    }

    setActiveTab(dashboardTabBtn, dashboardTab);

    const symptomTips = {
        cramps: "Try a heating pad or warm bath to relieve cramps.",
        headache: "Stay hydrated and consider over-the-counter pain relief.",
        "mood-swings": "Practice mindfulness or gentle yoga to manage mood swings.",
        bloating: "Avoid salty foods and drink plenty of water.",
        fatigue: "Get plenty of rest and consider light exercise."
    };

    const nutritionTips = {
        follicular: "Focus on iron-rich foods like spinach and lean meats.",
        ovulation: "Increase intake of omega-3 fatty acids like salmon and flaxseeds.",
        luteal: "Eat magnesium-rich foods like nuts and dark chocolate.",
        menstrual: "Stay hydrated and consume calcium-rich foods like yogurt."
    };

    // Toggle between login and signup forms
    showSignup.addEventListener('click', () => {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    });

    showLogin.addEventListener('click', () => {
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Toggle password visibility
    window.togglePassword = (id) => {
        const passwordInput = document.getElementById(id);
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
        } else {
            passwordInput.type = 'password';
        }
    };

    // Event Listeners (with duplicate prevention)
    if (loginBtn && !loginBtn.hasListener) {
        loginBtn.addEventListener('click', login);
        loginBtn.hasListener = true;
    }

    if (signupBtn && !signupBtn.hasListener) {
        signupBtn.addEventListener('click', signup);
        signupBtn.hasListener = true;
    }

    if (savePeriodBtn && !savePeriodBtn.hasListener) {
        savePeriodBtn.addEventListener('click', savePeriod);
        savePeriodBtn.hasListener = true;
    }

    if (logoutBtn && !logoutBtn.hasListener) {
        logoutBtn.addEventListener('click', logout);
        logoutBtn.hasListener = true;
    }

    if (sendInvitationBtn && !sendInvitationBtn.hasListener) {
        sendInvitationBtn.addEventListener('click', sendInvitation);
        sendInvitationBtn.hasListener = true;
    }

    if (startEndPeriodBtn && !startEndPeriodBtn.hasListener) {
        startEndPeriodBtn.addEventListener('click', startEndPeriod);
        startEndPeriodBtn.hasListener = true;
    }

    if (logSymptomsBtn && !logSymptomsBtn.hasListener) {
        logSymptomsBtn.addEventListener('click', () => {
            symptomsModal.style.display = 'block';
        });
        logSymptomsBtn.hasListener = true;
    }

    if (closeModalBtn && !closeModalBtn.hasListener) {
        closeModalBtn.addEventListener('click', () => {
            symptomsModal.style.display = 'none';
        });
        closeModalBtn.hasListener = true;
    }

    if (saveSymptomsBtn && !saveSymptomsBtn.hasListener) {
        saveSymptomsBtn.addEventListener('click', saveSymptoms);
        saveSymptomsBtn.hasListener = true;
    }

    // Login Function
    async function login() {
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            showDashboard(userCredential.user);
        } catch (error) {
            alert(error.message);
        }
    }
    
    async function signup() {
        const email = signupEmail.value.trim();
        const username = signupUsername.value.trim();
        const password = signupPassword.value.trim();
        const confirmPassword = signupConfirmPassword.value.trim();

        const genderRadios = document.querySelectorAll('input[name="gender"]');

        // Loop through the radio buttons to find the selected one
        let selectedGender = null;
        genderRadios.forEach(radio => {
            if (radio.checked) {
                selectedGender = radio.value; // Get the value of the selected radio button
            }
        });

        if (!email || !username || !password || !confirmPassword || !selectedGender) {
            alert('Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: email,
                username: username,
                gender: selectedGender,
                uid: userCredential.user.uid
            });
            showDashboard(userCredential.user);
        } catch (error) {
            alert(error.message);
        }
    }

    // Logout Function
    async function logout() {
        try {
            await signOut(auth);
            alert('You have been logged out.');
            window.location.href = 'http://127.0.0.1:5500/index.html';
            loginEmail.value = ''; // Clear email field
            loginPassword.value = ''; // Clear password field
        } catch (error) {
            alert(error.message);
        }
    }

    // Function to render the calendar
    function renderCalendar(year = null, month = null) {
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';

        const today = new Date();
        const currentYear = year || today.getFullYear();
        const currentMonth = month || today.getMonth();

        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);

        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        // Create calendar header
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.innerHTML = `
            <button id="prev-month">←</button>
            <span>${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(firstDay)}</span>
            <button id="next-month">→</button>
        `;
        calendar.appendChild(header);

        // Create calendar grid
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell empty';
            grid.appendChild(cell);
        }

        // Add cells for each day of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.textContent = i;

            // Disable future dates
            const cellDate = new Date(currentYear, currentMonth, i);
            if (cellDate > today) {
                cell.classList.add('disabled'); // Add a class to disable future dates
            } else {
                cell.addEventListener('click', () => {
                    // Remove active class from all cells
                    document.querySelectorAll('.calendar-cell').forEach(cell => {
                        cell.classList.remove('active');
                    });
                    // Add active class to the clicked cell
                    cell.classList.add('active');
                    showDayDetails(currentYear, currentMonth, i);
                });
            }

            grid.appendChild(cell);
        }

        calendar.appendChild(grid);

        // Add event listeners for prev/next month buttons
        document.getElementById('prev-month').addEventListener('click', () => {
            const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            renderCalendar(newYear, newMonth);
        });

        document.getElementById('next-month').addEventListener('click', () => {
            const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
            const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
            renderCalendar(newYear, newMonth);
        });
    }

    // Function to show day details
    function showDayDetails(year, month, day) {
        const selectedDate = new Date(year, month, day).toISOString().split('T')[0];
        document.getElementById('selected-date').textContent = selectedDate;
        document.getElementById('day-details').style.display = 'block';
    }

    // Function to show day details
    function showDayDetails(year, month, day) {
        const selectedDate = new Date(year, month, day+1).toISOString().split('T')[0];
        document.getElementById('selected-date').textContent = selectedDate;
        document.getElementById('day-details').style.display = 'block';
    }

    document.getElementById('save-day-btn').addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;
    
        const date = document.getElementById('selected-date').textContent;
        const symptoms = Array.from(document.querySelectorAll('input[name="symptoms"]:checked')).map(input => input.value);
        const flow = document.getElementById('flow').value;
    
        if (!date || symptoms.length === 0 || !flow) {
            alert('Please fill in all fields.');
            return;
        }
    
        try {
            await addDoc(collection(db, 'users', user.uid, 'symptoms'), {
                date: date,
                symptoms: symptoms,
                flow: flow,
                timestamp: new Date()
            });
            alert('Symptoms and flow logged!');
        } catch (error) {
            alert('Error logging symptoms and flow.');
        }
    });

    // Show Dashboard Function
    async function showDashboard(user) {
        authContainer.style.display = 'none';
        dashboard.style.display = 'block';
    
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
    
        usernameSpan.textContent = userData.username;
        // Add gender class to body
        document.body.classList.add(userData.gender);
    
        if (userData.gender === 'female') {
            loadCycleHistory(user.uid); // Load only the current user's cycle history
        }
    
        if (userData.partner) {
            // Load partner's cycle history only if the user is female
            if (userData.gender === 'male') {
                loadCycleHistory(userData.partner);
            }
        } else {
            console.log('No partner assigned to the user');
        }
    
        loadInvitations(user.uid);
    }

    // Send Invitation
    async function sendInvitation() {
        const fromUser = auth.currentUser;
        const toEmail = shareEmailInput.value.trim();
        if (fromUser && toEmail) {
            try {
                // Check if the email exists in Firebase Auth
                const signInMethods = await fetchSignInMethodsForEmail(auth, toEmail);

                if (signInMethods.length > 0) {
                    // Email exists in Firebase Auth
                    const toUserId = await getUserIdByEmail(toEmail); // Get the user's UID by email
                    const usersRef = doc(db, 'users', fromUser.uid);
                    await updateDoc(usersRef, { partner: toUserId });
                    // Create an invitation
                    await addDoc(collection(db, 'invitations'), {
                        fromUserId: fromUser.uid,
                        toUserId: toUserId,
                        status: 'pending',
                        timestamp: new Date()
                    });

                    alert('Invitation sent!');
                } else {
                    alert('User not found.');
                }
            } catch (error) {
                alert(error.message);
            }
        } else {
            alert('Please enter a valid email.');
        }
    }

    // Helper function to get user ID by email
    async function getUserIdByEmail(email) {
        const usersQuery = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(usersQuery);

        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].id; // Return the user's UID
        } else {
            throw new Error('User not found in Firestore.');
        }
    }

    window.acceptInvitation = async (invitationId) => {
        const user = auth.currentUser;
        const invitationRef = doc(db, 'invitations', invitationId);
        const invitation = (await getDoc(invitationRef)).data();

        await updateDoc(doc(db, 'users', user.uid), { partner: invitation.fromUserId });
        await updateDoc(invitationRef, { status: 'accepted' });
        isDashboardShown = true; // Mark dashboard as shown
        await showDashboard(user);
    };

    // Reject Invitation
    window.rejectInvitation = async (invitationId) => {
        try {
            const invitationRef = doc(db, 'invitations', invitationId);

            // Update the invitation status to 'rejected'
            await updateDoc(invitationRef, { status: 'rejected' });

            alert('Invitation rejected!');
            loadInvitations(auth.currentUser.uid); // Reload invitations after rejecting
        } catch (error) {
            console.error("Error rejecting invitation: ", error);
            alert('Error rejecting invitation.');
        }
    };
    

    // Check if User is Logged In
    onAuthStateChanged(auth, async (user) => {
        if (user && !isDashboardShown) {
            isDashboardShown = true; // Mark dashboard as shown
            await showDashboard(user);
        } else if (!user) {
            isDashboardShown = false; // Reset flag on logout
            authContainer.style.display = 'block';
            dashboard.style.display = 'none';
        }
    });

    // Save Period Function
    async function savePeriod() {
        loading.style.display = 'block';
        const user = auth.currentUser;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.data().gender !== 'female') {
            alert('Only female users can track periods');
            return;
        }
        const startDate = periodStartInput.value;
        const endDate = periodEndInput.value;

        // Get selected symptoms
        const symptoms = Array.from(document.querySelectorAll('input[name="symptoms"]:checked')).map(input => input.value);
        const tipsList = document.getElementById('nutrition-tips-content');
        tipsList.innerHTML = '';

        symptoms.forEach(symptom => {
            const li = document.createElement('li');
            li.textContent = symptomTips[symptom] || "No tips available for this symptom.";
            tipsList.appendChild(li);
        });
        
        // Get flow value
        const flow = document.getElementById('flow').value;

        if (user && startDate && endDate) {
            try {
                await addDoc(collection(db, 'users', user.uid, 'cycles'), {
                    startDate: startDate,
                    endDate: endDate,
                    symptoms: symptoms,
                    flow: flow,
                    timestamp: new Date()
                });
                alert('Period saved!');
                isDashboardShown = true; // Mark dashboard as shown
                await showDashboard(user);
            } catch (error) {
                alert(error.message);
            }
        } else {
            alert('Please fill in all fields.');
        }
        // Call this function after saving a new period
        sendPredictiveAlerts(cycles);
        loading.style.display = 'none';
    }

    // Start/End Period Function
    async function startEndPeriod() {
        const user = auth.currentUser;
        if (!user) return;

        if (!isPeriodActive) {
            // Start a new period
            const startDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
            await addDoc(collection(db, 'users', user.uid, 'cycles'), {
                startDate: startDate,
                endDate: null, // Period is ongoing
                symptoms: [],
                flow: null,
                timestamp: new Date()
            });
            isPeriodActive = true;
            startEndPeriodBtn.textContent = "End Period";
            alert('Period started!');
        } else {
            // End the current period
            const endDate = new Date().toISOString().split('T')[0]; // Today's date
            const cyclesQuery = query(collection(db, 'users', user.uid, 'cycles'), orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(cyclesQuery);
            const latestCycle = querySnapshot.docs[0];

            await updateDoc(latestCycle.ref, { endDate: endDate });
            isPeriodActive = false;
            startEndPeriodBtn.textContent = "Start Period";
            alert('Period ended!');
        }

        // Reload cycle history
        loadCycleHistory(user.uid);
    }

    // Save Symptoms Function
    async function saveSymptoms() {
        const user = auth.currentUser;
        if (!user) return;

        const date = document.getElementById('symptoms-date').value;
        const symptoms = Array.from(document.querySelectorAll('input[name="symptoms"]:checked')).map(input => input.value);
        const flow = document.getElementById('flow').value;

        if (!date || symptoms.length === 0 || !flow) {
            alert('Please fill in all fields.');
            return;
        }

        try {
            await addDoc(collection(db, 'users', user.uid, 'symptoms'), {
                date: date,
                symptoms: symptoms,
                flow: flow,
                timestamp: new Date()
            });
            alert('Symptoms and flow logged!');
            symptomsModal.style.display = 'none';
        } catch (error) {
            alert('Error logging symptoms and flow.');
        }
    }

    // Load Cycle History Function
    async function loadCycleHistory(userId) {
        if (!cycleHistory) {
            console.error('Cycle history element not found');
            return;
        }
    
        cycleHistory.innerHTML = ''; // Clear previous data
    
        try {
            const cyclesQuery = query(
                collection(db, 'users', userId, 'cycles'),
                orderBy('endDate', 'desc')
            );
    
            const querySnapshot = await getDocs(cyclesQuery);
            const cycles = [];
    
            querySnapshot.forEach((doc) => {
                const cycle = doc.data();
                cycles.push(cycle);
    
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>Start:</strong> ${cycle.startDate}, <strong>End:</strong> ${cycle.endDate}<br>
                    <strong>Symptoms:</strong> ${cycle.symptoms?.join(', ') || 'None'}<br>
                    <strong>Flow:</strong> ${cycle.flow || 'Not specified'}
                `;
                cycleHistory.appendChild(li);
            });
    
            // Show prediction
            const prediction = predictNextPeriod(cycles);
            if (nextPeriod) {
                nextPeriod.textContent = prediction;
            }

            // Show cycle stats
            const stats = calculateCycleStats(cycles);
            document.getElementById('avg-cycle-length-stat').textContent = stats.avgCycleLength;
            document.getElementById('avg-period-length-stat').textContent = calculateAveragePeriodLength(cycles);
            document.getElementById('ovulation-window-stat').textContent = stats.ovulationWindow;
            document.getElementById('fertile-days-stat').textContent = stats.fertileDays;

            // Calculate current cycle phase
            if (cycles.length > 0) {
                const currentCyclePhase = getCurrentCyclePhase(cycles);
                document.getElementById('nutrition-tips-content').textContent = getNutritionTips(currentCyclePhase);
            }
        } catch (error) {
            console.error('Error loading cycle history:', error);
        }
    }
    
    // Load Invitations Function
    async function loadInvitations(userId) {
        if (!invitationsList) {
            console.error('Invitations list element not found');
            return;
        }
        invitationsList.innerHTML = ''; // Clear previous data
    
        try {
            const receivedInvitationsQuery = query(
                collection(db, 'invitations'),
                where('toUserId', '==', userId),
                where('status', '==', 'pending')
            );
    
            const receivedInvitationsSnapshot = await getDocs(receivedInvitationsQuery);
    
            if (receivedInvitationsSnapshot.empty) {
                console.log('No invitations found.');
            } else {
                document.getElementById('invitations-section').style.display = 'block';
                receivedInvitationsSnapshot.forEach((doc) => {
                    const invitation = doc.data();
                    const li = document.createElement('li');
                    li.innerHTML = `
                        Invitation from: ${invitation.fromUserId}
                        <button class="accept-btn" data-invitation-id="${doc.id}">Accept</button>
                        <button class="reject-btn" data-invitation-id="${doc.id}">Reject</button>
                    `;
                    invitationsList.appendChild(li);
                });
    
                // Attach event listeners to buttons
                document.querySelectorAll('.accept-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const invitationId = button.getAttribute('data-invitation-id');
                        acceptInvitation(invitationId);
                    });
                });
    
                document.querySelectorAll('.reject-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const invitationId = button.getAttribute('data-invitation-id');
                        rejectInvitation(invitationId);
                    });
                });
            }
        } catch (error) {
            console.error('Error loading invitations:', error);
        }
    }

    // Predict Next Period Function
    function predictNextPeriod(cycles) {
        if (cycles.length < 2) {
            document.getElementById('days-until-period').textContent = "?";
            return "Not enough data to predict.";
        }
        const averageCycleLength = parseInt(calculateCycleLength(cycles));
        const lastPeriodEnd = new Date(cycles[0].endDate);
        const nextPeriodStart = new Date(lastPeriodEnd);
        nextPeriodStart.setDate(lastPeriodEnd.getDate() + averageCycleLength);

        const currentDate = new Date();
        const timeDiff = Math.abs(nextPeriodStart - currentDate);
        const daysUntilPeriod = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        // Update the prediction circle
        document.getElementById('days-until-period').textContent = daysUntilPeriod;

        return `Next period is expected around: ${nextPeriodStart.toDateString()}`;
    }

    // Calculate Cycle Stats Function
    function calculateCycleStats(cycles) {
        if (cycles.length < 2) {
            return {
                avgCycleLength: "Not enough data",
                ovulationWindow: "Not enough data",
                fertileDays: "Not enough data"
            };
        }

        const avgCycleLength = calculateCycleLength(cycles);
    
        // Calculate ovulation window and fertile days
        const ovulationDay = Math.round(avgCycleLength / 2);
        const ovulationWindow = `Day ${ovulationDay - 1} to Day ${ovulationDay + 1}`;
        const fertileDays = `Day ${ovulationDay - 3} to Day ${ovulationDay + 1}`;
    
        return {
            avgCycleLength: `${avgCycleLength} days`,
            ovulationWindow,
            fertileDays
        };
    }

    // Calculate Average Period Length Function
    function calculateAveragePeriodLength(cycles) {
        if (cycles.length === 0) {
            return "Not enough data to calculate average period length.";
        }

        let totalDays = 0;
        for (const cycle of cycles) {
            const startDate = new Date(cycle.startDate);
            const endDate = new Date(cycle.endDate);
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalDays += diffDays;
        }

        const averagePeriodLength = Math.abs(totalDays / cycles.length)
        return `${averagePeriodLength} days`;
    }

    function calculateCycleLength(cycles) {
        if (cycles.length < 2) {
            return "Not enough data to calculate cycle length.";
        }
    
        let totalDays = 0;
        for (let i = cycles.length - 1; i > 1; i--) {
            const endDate1 = new Date(cycles[i].endDate);
            const startDate2 = new Date(cycles[i - 1].startDate);
            const diffTime = Math.abs(startDate2 - endDate1);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalDays += diffDays;
        }
    
        const averageCycleLength = Math.round(totalDays / (cycles.length - 2));
        return averageCycleLength;
    }

    // Get Current Cycle Phase Function
    function getCurrentCyclePhase(cycles) {
        if (cycles.length < 1) {
            return "Not enough data to determine cycle phase.";
        }

        const lastPeriodEnd = new Date(cycles[0].endDate);
        const currentDate = new Date();
        const daysSinceLastPeriod = Math.floor((currentDate - lastPeriodEnd) / (1000 * 60 * 60 * 24));

        const averageCycleLength = parseInt(calculateCycleLength(cycles));

        if (daysSinceLastPeriod < 0) {
            return "unknown"; // Invalid data
        } else if (daysSinceLastPeriod <= 5) {
            return "menstrual";
        } else if (daysSinceLastPeriod <= 14) {
            return "follicular";
        } else if (daysSinceLastPeriod <= 16) {
            return "ovulation";
        } else if (daysSinceLastPeriod <= averageCycleLength) {
            return "luteal";
        } else {
            return "unknown"; // Outside the cycle range
        }
    }

    // Send Predictive Alerts Function
    function sendPredictiveAlerts(cycles) {
        if (cycles.length < 2) return;

        const lastPeriodStart = new Date(cycles[cycles.length - 1].startDate);
        const avgCycleLength = calculateCycleStats(cycles).avgCycleLength;
        const nextPeriodStart = new Date(lastPeriodStart);
        nextPeriodStart.setDate(lastPeriodStart.getDate() + parseInt(avgCycleLength));

        const ovulationDay = Math.round(parseInt(avgCycleLength) / 2);
        const ovulationDate = new Date(lastPeriodStart);
        ovulationDate.setDate(lastPeriodStart.getDate() + ovulationDay);

        alert(`Your next period is expected around: ${nextPeriodStart.toDateString()}\nOvulation is expected around: ${ovulationDate.toDateString()}`);
    }

    // Get Nutrition Tips Function
    function getNutritionTips(cyclePhase) {
        return nutritionTips[cyclePhase] || "No specific tips for this phase.";
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in
            authContainer.style.display = 'none'; // Hide the login/signup form
            dashboard.style.display = 'block'; // Show the dashboard
        } else {
            // User is not signed in
            console.log("No user is logged in.");
            authContainer.style.display = 'block'; // Show the login/signup form
            dashboard.style.display = 'none'; // Hide the dashboard
        }
    });
});