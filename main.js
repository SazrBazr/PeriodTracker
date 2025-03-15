// main.js
import { auth } from './firebaseConfig.js';
import { login, signup, logout, onAuthChanged, checkEmailExists } from './auth.js';
import { getUserData, setUserData, addCycleData, addSymptomData, getCycleHistory, getCycleHistoryWithId, getUserIdByEmail, sendInvitation, updateInvitationStatus, updateUserPartner } from './firestore.js';
import { showDashboard, showAuth, renderCycleHistory, updateUi, showLoadingSpinner, hideLoadingSpinner } from './ui.js';
import { predictNextPeriod, calculateAveragePeriodLength, calculateCycleLength } from './utils.js';
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
    const shareEmailInput = document.getElementById('messageInput');
    const sendInvitationBtn = document.getElementById('sendButton');
    const startPeriodBtn = document.getElementById('start-period-btn');
    const endPeriodBtn = document.getElementById('end-period-btn');
    const symptomsModal = document.getElementById('symptoms-modal');
    const saveSymptomsBtn = document.getElementById('save-day-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const infoIcons = document.querySelectorAll('.info');

    let clickedDate = new Date().toISOString().split('T')[0];

    showDayDetails(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1);

    // Add click event listener to each info icon
    infoIcons.forEach((icon) => {
        icon.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent event bubbling
        const stat = icon.closest('.stat'); // Find the closest parent stat container
        stat.classList.toggle('active'); // Toggle the active class
        });
    });

    // Close tooltips when clicking outside
    document.addEventListener('click', () => {
        infoIcons.forEach((icon) => {
        const stat = icon.closest('.stat');
        stat.classList.remove('active');
        });
    });


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
        const userData = await getUserData(user.uid);
        let cycles;
        if (userData.gender === "Female") {
            cycles = await getCycleHistory(user.uid);
        } else if (userData.partner) {
            cycles = await getCycleHistory(userData.partner);
        } else {
            cycles = []; // No partner, so no cycles to display
        }

        const currentDate = new Date();
        let expectedPeriodStart = new Date(currentDate);
        let expectedPeriodEnd;
        let ovulationWindowStartDate;
        let ovulationWindowEndDate;

        if (cycles.length != 0) {
            // Predict the start of the next period by adding the result of predictNextPeriod to the current date
            expectedPeriodStart.setDate(currentDate.getDate() + predictNextPeriod(cycles) - 1);

            // Calculate the end of the period by adding the average period length to the start date
            expectedPeriodEnd = new Date(expectedPeriodStart);
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

            ovulationWindowStartDate = new Date(lastPeriodStart);
            ovulationWindowStartDate.setDate(lastPeriodStart.getDate() + ovulationWindowStart - 1);

            ovulationWindowEndDate = new Date(lastPeriodStart);
            ovulationWindowEndDate.setDate(lastPeriodStart.getDate() + ovulationWindowEnd);
        }

        // Add cells for each day of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.textContent = i;

            const cellDate = new Date(currentYear, currentMonth, i);
            const cellCheckDate = new Date(currentYear, currentMonth, i+1);

            // Disable future dates
            if (cycles.length != 0) {
                if (expectedPeriodStart <= cellCheckDate && cellCheckDate <= expectedPeriodEnd) {
                    cell.classList.add('pDay');
                }
                if (ovulationWindowStartDate <= cellCheckDate && cellCheckDate <= ovulationWindowEndDate) {
                    cell.classList.add('ovDay');
                }
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
                    showDayDetails(currentYear, currentMonth, i + 1);
                });
            }

            grid.appendChild(cell);
        }

        calendar.appendChild(grid);
    }

    // Add event listeners for prev/next month buttons
    async function prevMonth(year, month) {
        if(month === 1) {
            await renderCalendar(year - 1, 12);
        }else {
            await renderCalendar(year, month - 1);
        }
    }

    async function nextMonth(year, month) {
        if(month === 12) {
            await renderCalendar(year + 1, 1);
        }
        else{
            await renderCalendar(year, month + 1);
        }
    }

    // Function to show day details
    function showDayDetails(year, month, day) {
        const user = auth.currentUser;
        if(!user) return;
        userData = user.getUserData(user.uid);
        if(userData.gender === 'Male') {
            document.getElementById('day-details').style.display = 'none';
            return;
        }
        showLoadingSpinner();
        clickedDate = new Date(year, month, day).toISOString().split('T')[0];
        const selectedDate = new Date(year, month, day).toISOString().split('T')[0];
        document.getElementById('selected-date').textContent = selectedDate;
        document.getElementById('day-details').style.display = 'block';
        hideLoadingSpinner();
    }

    // Toggle between login and signup forms
    showSignup.addEventListener('click', () => {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        hideLoadingSpinner();
    });

    showLogin.addEventListener('click', () => {
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
        hideLoadingSpinner();
    });

    // Event Listeners
    loginBtn.addEventListener('click', async () => {
        showLoadingSpinner();
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }
        await updateUi();
        await renderCalendar();
        
        try {
            const user = await login(email, password);
            if (user) {
                //if (user.emailVerified) {
                    const userData = await getUserData(user.uid);
                    showDashboard(userData);
                    if (userData.gender === 'Female') {
                        document.getElementById('day-details').style.display = 'block';
                        document.getElementById('female-only').style.display = 'block';
                        document.getElementById('invitations-section').style.display = 'block';
                    }
                    else{
                        document.getElementById('day-details').style.display = 'none';
                        document.getElementById('female-only').style.display = 'none';
                        document.getElementById('invitations-section').style.display = 'none';
                    }
                //} else {
                    console.log("Email is not verified.");
                    showAuth();
                    //alert("Please verify your email first");
                //}
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

        showLoadingSpinner();
        try {
            const user = await signup(email, password);
            await setUserData(user.uid, {
                email: email,
                password: password,
                username: username,
                gender: selectedGender,
                uid: user.uid
            });
            const userData = await getUserData(user.uid);
            showDashboard(userData);
        } catch (error) {
            alert(error.message);
        }
        hideLoadingSpinner();
    });

    logoutBtn.addEventListener('click', async () => {
        showLoadingSpinner();
        try {
            await logout();
        } catch (error) {
            alert(error.message);
        }
        hideLoadingSpinner();
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
    
        await updateUi();
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
        await updateUi();
        await renderCalendar();
        if (user) {
            //if (user.emailVerified) {
                const userData = await getUserData(user.uid);
                showDashboard(userData);
                if (userData.gender === 'Female') {
                    document.getElementById('day-details').style.display = 'block';
                    document.getElementById('female-only').style.display = 'block';
                    document.getElementById('invitations-section').style.display = 'block';
                }
                else{
                    document.getElementById('day-details').style.display = 'none';
                    document.getElementById('female-only').style.display = 'none';
                    document.getElementById('invitations-section').style.display = 'none';
                }
            //} else {
                console.log("Email is not verified.");
                
            //}

        } else {
            showAuth();
            //alert("Please verify your email first");
        }
    });
});