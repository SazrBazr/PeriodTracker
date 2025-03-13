// main.js
import { auth, db } from './firebaseConfig.js';
import { login, signup, logout, onAuthChanged, checkEmailExists } from './auth.js';
import { getUserData, setUserData, addCycleData, addSymptomData, getCycleHistory, getCycleHistoryWithId, getUserIdByEmail, sendInvitation, updateInvitationStatus, updateUserPartner, getPendingInvitations } from './firestore.js';
import { showDashboard, showAuth, renderCycleHistory, renderInvitations, showPrediction, showCycleStats, showNutritionTips, updateUi } from './ui.js';
import { predictNextPeriod, calculateCycleStats, getCurrentCyclePhase, getNutritionTips, calculateAveragePeriodLength, calculateCycleLength } from './utils.js';
import { updateDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";


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
    const logoutBtn = document.getElementById('logout-btn');
    const shareEmailInput = document.getElementById('invite-email');
    const sendInvitationBtn = document.getElementById('invite-btn');
    const startPeriodBtn = document.getElementById('start-period-btn');
    const endPeriodBtn = document.getElementById('end-period-btn');
    // const logSymptomsBtn = document.getElementById('log-symptoms-btn');
    const symptomsModal = document.getElementById('symptoms-modal');
    const saveSymptomsBtn = document.getElementById('save-day-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');

    // const dashboardTabBtn = document.getElementById('dashboard-tab-btn');
    // const trackingTabBtn = document.getElementById('tracking-tab-btn');
    // const statsTabBtn = document.getElementById('stats-tab-btn');

    // const dashboardTab = document.getElementById('dashboard-tab');
    // const trackingTab = document.getElementById('tracking-tab');
    // const statsTab = document.getElementById('stats-tab');

    // const hamburger = document.getElementById('hamburger');
    // const navLinks = document.getElementById('nav-links');

    let clickedDate = new Date().toISOString().split('T')[0];

    showDayDetails(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1);

    // // Switch to Dashboard Tab
    // dashboardTabBtn.addEventListener('click', () => {
    //     setActiveTab(dashboardTabBtn, dashboardTab);
    // });

    // //Switch to Tracking Tab
    // trackingTabBtn.addEventListener('click', () => {
    //     setActiveTab(trackingTabBtn, trackingTab);
    //     renderCalendar(); // Render the calendar when the tracking tab is opened
    // });

    // // Switch to Stats Tab
    // statsTabBtn.addEventListener('click', () => {
    //     setActiveTab(statsTabBtn, statsTab);
    // });

    // // Function to set the active tab
    // function setActiveTab(button, tab) {
    //     // Remove active class from all buttons and tabs
    //     dashboardTabBtn.classList.remove('active');
    //     trackingTabBtn.classList.remove('active');
    //     statsTabBtn.classList.remove('active');

    //     dashboardTab.classList.remove('active');
    //     trackingTab.classList.remove('active');
    //     statsTab.classList.remove('active');

    //     // Add active class to the selected button and tab
    //     button.classList.add('active');
    //     tab.classList.add('active');
    // }

    // setActiveTab(dashboardTabBtn, dashboardTab);

    // Function to render the calendar
    async function renderCalendar(year = null, month = null) {
        
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
        const prevMonthBtn = document.createElement('button');
        prevMonthBtn.id = 'prev-month';
        prevMonthBtn.textContent = '←';
        prevMonthBtn.onclick = () => prevMonth(currentYear, currentMonth);
        const nextMonthBtn = document.createElement('button');
        nextMonthBtn.id = 'next-month'; 
        nextMonthBtn.textContent = '→';
        nextMonthBtn.onclick = () => nextMonth(currentYear, currentMonth);
        const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(firstDay);
        const monthYearSpan = document.createElement('span');
        monthYearSpan.textContent = monthYear;
        header.appendChild(prevMonthBtn);
        header.appendChild(monthYearSpan);
        header.appendChild(nextMonthBtn);
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

        const user = auth.currentUser;
        if (!user) return;
        const cycles = await getCycleHistory(user.uid);

        const currentDate = new Date();

        // Predict the start of the next period by adding the result of predictNextPeriod to the current date
        const expectedPeriodStart = new Date(currentDate);
        expectedPeriodStart.setDate(currentDate.getDate() + predictNextPeriod(cycles) - 1);
        
        // Calculate the end of the period by adding the average period length to the start date
        const expectedPeriodEnd = new Date(expectedPeriodStart);
        expectedPeriodEnd.setDate(expectedPeriodStart.getDate() + calculateAveragePeriodLength(cycles));

        // Assuming cycles[0].startDate is a valid Date object
        const lastPeriodStart = new Date(cycles[0].startDate);

        // Calculate the average cycle length
        const avgCycleLength = calculateCycleLength(cycles);

        // Calculate the ovulation day (14 days before the end of the cycle)
        const ovulationDay = Math.round(avgCycleLength - 14);

        // Calculate the ovulation window (2 days before and after ovulation day)
        const ovulationWindowStart = ovulationDay - 2;
        const ovulationWindowEnd = ovulationDay + 2;

        // Create Date objects for the ovulation day and its window
        const ovulationDate = new Date(lastPeriodStart);
        ovulationDate.setDate(lastPeriodStart.getDate() + ovulationDay);

        const ovulationWindowStartDate = new Date(lastPeriodStart);
        ovulationWindowStartDate.setDate(lastPeriodStart.getDate() + ovulationWindowStart - 1);

        const ovulationWindowEndDate = new Date(lastPeriodStart);
        ovulationWindowEndDate.setDate(lastPeriodStart.getDate() + ovulationWindowEnd);

        // Add cells for each day of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.textContent = i;

            // Disable future dates
            const cellDate = new Date(currentYear, currentMonth, i);
            if(expectedPeriodStart <= cellDate && cellDate <= expectedPeriodEnd){
                cell.classList.add('pDay');
            }
            if(ovulationWindowStartDate <= cellDate && cellDate <= ovulationWindowEndDate){
                cell.classList.add('ovDay');
            }
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
                    showDayDetails(currentYear, currentMonth, i + 1)
                });
            }

            grid.appendChild(cell);
        }

        calendar.appendChild(grid);
    }

    // Add event listeners for prev/next month buttons
    function prevMonth(year, month) {
        if(month === 1) {
            renderCalendar(year - 1, 12);
        }else {
            renderCalendar(year, month - 1);
        }
    }

    function nextMonth(year, month) {
        if(month === 12) {
            renderCalendar(year + 1, 1);
        }
        else{
            renderCalendar(year, month + 1);
        }
    }

    // Function to show day details
    function showDayDetails(year, month, day) {
        clickedDate = new Date(year, month, day).toISOString().split('T')[0];
        const selectedDate = new Date(year, month, day).toISOString().split('T')[0];
        document.getElementById('selected-date').textContent = selectedDate;
        document.getElementById('day-details').style.display = 'block';
    }

    // hamburger.addEventListener('click', () => {
    //     navLinks.classList.toggle('active');
    // });

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

    // Event Listeners
    loginBtn.addEventListener('click', async () => {
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }

        try {
            const user = await login(email, password);
            const userData = await getUserData(user.uid);
            showDashboard(userData);
            if (userData.gender === 'female') {
                document.getElementById('tracking-tab-btn').style.display = 'block';
                document.getElementById('invitations-section').style.display = 'block';
                updateUi();
            }
        } catch (error) {
            alert(error.message);
        }
    });

    signupBtn.addEventListener('click', async () => {
        const email = signupEmail.value.trim();
        const username = signupUsername.value.trim();
        const password = signupPassword.value.trim();
        const confirmPassword = signupConfirmPassword.value.trim();

        const genderRadios = document.querySelectorAll('input[name="gender"]');
        let selectedGender = null;
        genderRadios.forEach(radio => {
            if (radio.checked) {
                selectedGender = radio.value;
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
            const user = await signup(email, password);
            await setUserData(user.uid, {
                email: email,
                username: username,
                gender: selectedGender,
                uid: user.uid
            });
            const userData = await getUserData(user.uid);
            showDashboard(userData);
        } catch (error) {
            alert(error.message);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        try {
            await logout();
            alert('You have been logged out.');
            window.location.href = 'http://127.0.0.1:5500/index.html';
        } catch (error) {
            alert(error.message);
        }
    });

    startPeriodBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;
    
        const cycles = await getCycleHistory(user.uid);
        const latestCycle = cycles.length > 0 ? cycles[0] : null;
    
        if (latestCycle && latestCycle.endDate === null) {
            alert("There is already an active Period")
        } else {
            // User is starting a new period    
            if (clickedDate) {
                await addCycleData(user.uid, {
                    startDate: clickedDate,
                    endDate: null,
                    timestamp: new Date()
                });
                startPeriodBtn.textContent = "End Period";
                alert('Period started on ' + clickedDate);
            }
        }
    
        renderCycleHistory(await getCycleHistory(user.uid)); // Refresh history
    });

    endPeriodBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;
    
        const cycles = await getCycleHistory(user.uid);
        const latestCycle = cycles.length > 0 ? cycles[0] : null;
    
        if (latestCycle && latestCycle.endDate === null) {
            // User is ending the period    
            if (clickedDate) {
                await updateDoc(latestCycle.ref, { endDate: clickedDate });
                startPeriodBtn.textContent = "Start Period";
                alert('Period ended on ' + clickedDate);
            }
        } else {
            alert("There is no active Period")
        }

        renderCycleHistory(await getCycleHistory(user.uid)); // Refresh history
    });

    saveSymptomsBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;
    
        // Fetch the latest cycle using getCycleHistory
        const cycles = await getCycleHistoryWithId(user.uid);
    
        if (cycles.length === 0) {
            alert('No active cycle found. Please start a cycle first.');
            return;
        }

        const symptoms = Array.from(document.querySelectorAll('input[name="symptoms"]:checked')).map(input => input.value);
        const flow = document.getElementById('flow').value;
    
        if (!clickedDate || symptoms.length === 0 || !flow) {
            alert('Please fill in all fields.');
            return;
        }
    
        try {
            // Add symptoms to the symptoms subcollection under the latest cycle
            await addSymptomData(user.uid, {
                date: clickedDate,
                symptoms: symptoms,
                flow: flow,
                timestamp: new Date()
            });
            alert('Symptoms and flow logged!');
            symptomsModal.style.display = 'none';
        } catch (error) {
            alert('Error logging symptoms and flow: ' + error.message);
        }
    });

    sendInvitationBtn.addEventListener('click', async () => {
        const fromUser = auth.currentUser;
        const toEmail = shareEmailInput.value.trim();
        if (fromUser && toEmail) {
            try {
                const emailExists = await checkEmailExists(toEmail);
                if (emailExists) {
                    const toUserId = await getUserIdByEmail(toEmail);
                    await updateUserPartner(fromUser.uid, toUserId);
                    await sendInvitation(fromUser.uid, toUserId);
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
    });

    closeModalBtn.addEventListener('click', () => {
        symptomsModal.style.display = 'none';
    });

    onAuthChanged(async (user) => {
        if (user) {
            const userData = await getUserData(user.uid);
            showDashboard(userData);
            if (userData.gender === 'female') {
                // document.getElementById('tracking-tab-btn').style.display = 'block';
                document.getElementById('invitations-section').style.display = 'block';
                // document.getElementById('menu-bar').style.display = 'block';
                renderCalendar();
                updateUi();
            }
            const invitations = await getPendingInvitations(user.uid);
            renderInvitations(invitations);
        } else {
            showAuth();
        }
    });
});