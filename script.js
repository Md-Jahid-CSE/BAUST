// Step 1: Import all necessary libraries at the top
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getDatabase, ref, get, set, child } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-analytics.js";

// Step 2: Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBUq_szwEsm50CLZRxUiD6CmXNiB3OwNRc", // Your Firebase API Key
    authDomain: "ctquestions-ac5f2.firebaseapp.com",
    databaseURL: "https://ctquestions-ac5f2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ctquestions-ac5f2",
    storageBucket: "ctquestions-ac5f2.appspot.com",
    messagingSenderId: "421824009186",
    appId: "1:421824009186:web:298554ad147781e6ec5fbb",
    measurementId: "G-DSEDQ51WF3"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const sdk = { ref, get, set, child };

// --- Custom Fingerprinting Helper ---
async function sha256(str) {
    if (typeof crypto === 'undefined' || !crypto.subtle || !crypto.subtle.digest) {
        console.warn('Web Crypto API not available for SHA256 hashing. Using fallback.');
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; 
        }
        return Math.abs(hash).toString(16);
    }
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.prototype.map.call(new Uint8Array(buf), x => (('00' + x.toString(16)).slice(-2))).join('');
}

async function generateCustomDeviceFingerprint() {
    const components = [];
    components.push(`ua:${navigator.userAgent || 'N/A'}`);
    components.push(`lang:${navigator.language || 'N/A'}`);
    components.push(`platform:${navigator.platform || 'N/A'}`);
    components.push(`screen:${(screen.width || 0)}x${(screen.height || 0)}x${(screen.colorDepth || 0)}`);
    components.push(`concurrency:${navigator.hardwareConcurrency || 0}`);
    if (navigator.deviceMemory) { 
        components.push(`memory:${navigator.deviceMemory}`);
    }
    components.push(`timezone:${new Date().getTimezoneOffset()}`);
    components.push(`touch:${'maxTouchPoints' in navigator ? navigator.maxTouchPoints : 'N/A'}`);
    
    try {
        if (navigator.plugins) {
            let pluginsStr = "";
            for (let i = 0; i < navigator.plugins.length; i++) {
                pluginsStr += `${navigator.plugins[i].name}:${navigator.plugins[i].description};`;
            }
            components.push(`plugins:${await sha256(pluginsStr)}`);
        } else {
            components.push('plugins:N/A');
        }
    } catch (e) {
        components.push('plugins:error');
    }

    try {
        const canvas = document.createElement('canvas');
        canvas.width = 220;
        canvas.height = 30;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "#f60";
            ctx.fillRect(100, 1, 62, 20);
            ctx.fillStyle = "#069";
            ctx.font = "11pt 'Arial'";
            const textToRender = "Browser CT Portal Test; 测验; الاختبار; પરીક્ષણ 🧐";
            ctx.fillText(textToRender, 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.font = "12pt 'Verdana'";
            ctx.fillText(textToRender, 4, 17);
            
            const canvasDataUrl = canvas.toDataURL();
            components.push(`canvas:${await sha256(canvasDataUrl)}`);
        } else {
            components.push('canvas:unavailable_ctx');
        }
    } catch (e) {
        console.warn("Canvas fingerprinting failed:", e);
        components.push('canvas:error_exception');
    }

    const rawFingerprintString = components.join('||');
    return `customfp_${await sha256(rawFingerprintString)}`;
}


// --- Main Application Logic ---
function runApp() {
    let userIP = 'Loading...';
    let deviceFingerprint = null;
    let currentStudent = null;
    let currentSubject = null;
    let currentPdfUrl = null;
    let devToolsCheckInterval = null; // For setInterval

    // --- DOM Elements ---
    const dom = {
        body: document.body,
        login: {
            section: document.getElementById('loginSection'),
            studentIdInput: document.getElementById('studentIdInput'),
            loginBtn: document.getElementById('loginBtn'),
            btnText: document.querySelector('#loginBtn .btn-text'),
            btnLoader: document.querySelector('#loginBtn .btn-loader'),
            error: document.getElementById('loginError'),
            userIP: document.getElementById('userIP'),
        },
        payment: {
            section: document.getElementById('paymentSection'),
            backBtn: document.getElementById('paymentBackBtn'),
            studentName: document.getElementById('studentName'),
            studentId: document.getElementById('paymentStudentId'),
            ip: document.getElementById('paymentIP'),
        },
        dashboard: {
            section: document.getElementById('dashboardSection'),
            logoutBtn: document.getElementById('dashboardLogoutBtn'),
            name: document.getElementById('dashboardName'),
            ip: document.getElementById('dashboardIP'),
            subjectsGrid: document.getElementById('subjectsGrid'),
        },
        ct: {
            section: document.getElementById('ctSection'),
            backBtn: document.getElementById('ctBackBtn'),
            title: document.getElementById('subjectTitle'),
            grid: document.getElementById('ctGrid'),
            midtermSection: document.getElementById('midtermSection'),
        },
        pdf: {
            section: document.getElementById('pdfSection'),
            backBtn: document.getElementById('pdfBackBtn'),
            title: document.getElementById('pdfTitle'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            viewer: document.getElementById('pdfViewer'),
            dynamicWatermarkContainer: document.getElementById('dynamicWatermarkContainer'),
            screenshotShield: document.getElementById('screenshotShield'), // Added
        },
        watermark: document.getElementById('watermark'),
    };

    // --- PDF Data ---
    const pdfLinks = {
        "MATH 1243": { name: "Ordinary and Partial Differential Equation", icon: "📊", 
                      CT1: "https://drive.google.com/file/d/1L-8tdiVc7C4CwIsVELbvhIGE90TnEw0V/preview", 
                      CT2: "https://drive.google.com/file/d/1qsfMQirr_VpVNbqueZQMLSz_KCzNEYlX/preview", 
                      CT3: "https://drive.google.com/file/d/1BFJ7Z6BfViMETylxGeD27MC6Cz1nSdQs/preview", 
                      Midterm: "https://drive.google.com/file/d/1i0y4tIeOTsOg-ueouUjEBNRmywzehcMo/preview" },
        
        "CSE 1201": { name: "Discrete Mathematics", icon: "⚛️", 
                     CT1: "https://drive.google.com/file/d/1YiooY2EoNCQnxBIUtpwBPlNN6EyhXrHo/preview", 
                     CT2: "https://drive.google.com/file/d/1nu_zk9K_u1iqxUZwVVbjo04ahhqkCzlw/preview", 
                     CT3: "https://drive.google.com/file/d/11WHnK01vHiMX9GyfKdXz1XCn02Yh7Qbl/preview", 
                     Midterm: "https://drive.google.com/file/d/1m7zLsxptGDzxI0s2GOgKruv-mHMAG4fB/preview" },
        
        "CSE 1203": { name: "Object-Oriented Programming", icon: "💻", 
                     CT1: "https://drive.google.com/file/d/1bZjSPt-tnvW2m_3bt-LM9BnHESArDK7E/preview", 
                     CT2: "https://drive.google.com/file/d/13mxyCGTPO7b2fyfXZKAPC0F-qBC9B1oU/preview", 
                     CT3: "https://drive.google.com/file/d/1BxP2tSe19MIsEGH4IWT9nbaAVz9M1JtQ/preview", 
                     Midterm: "https://drive.google.com/file/d/1VJLJw8pNQ39dWUzPBszPmckwDlSmHiKw/preview" },
        
        "EEE 1269": { name: "Electronic Circuits", icon: "⚡", 
                     CT1: "https://drive.google.com/file/d/1i8xLt0VTTo-hQIj-SxqNZqPXReCnmfqu/preview", 
                     CT2: "https://drive.google.com/file/d/1ZVF-8NanBU_osiTwMpKrY87EiNv4jN_Q/preview", 
                     CT3: "https://drive.google.com/file/d/1iM3ursihn1hqJn4qww6weUM8fSTEEGAf/preview", 
                     Midterm: "https://drive.google.com/file/d/1FFCt-SsWx5szpdnXczJxjWr1mC5diCHG/preview" },
    };

    // --- UI & View Management ---
    const switchView = (targetSection) => { document.querySelectorAll('.section-view').forEach(s => s.classList.add('hidden')); if (targetSection) { targetSection.classList.remove('hidden'); } };
    const showError = (message) => { dom.login.error.textContent = message; dom.login.error.classList.remove('hidden'); };
    const hideError = () => dom.login.error.classList.add('hidden');
    
    const setLoginButtonState = (isLoading, buttonTextOverride = null) => {
        dom.login.loginBtn.disabled = isLoading;
        const currentText = buttonTextOverride || 'Login';
        dom.login.btnText.textContent = currentText;

        if (isLoading) {
            dom.login.btnLoader.classList.remove('hidden');
            if (currentText === 'Login' && buttonTextOverride === null) {
                 dom.login.btnText.classList.add('hidden');
            } else {
                 dom.login.btnText.classList.remove('hidden');
            }
        } else {
            dom.login.btnText.classList.remove('hidden');
            dom.login.btnLoader.classList.add('hidden');
        }
    };

    // --- IP and Device Fingerprinting ---
    const getDeviceAndNetworkInfo = async () => {
        setLoginButtonState(true, 'Identifying Device...');
        updateIPDisplayInternal('Loading IP...', 'Loading Device ID...');

        let ipSuccess = false;
        let fpSuccess = false;

        try {
            const response = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) });
            if (!response.ok) throw new Error(`IPify request failed with status ${response.status}`);
            userIP = (await response.json()).ip;
            ipSuccess = true;
        } catch (error) {
            console.warn('IP fetch failed:', error);
            userIP = 'Unavailable';
        }

        try {
            deviceFingerprint = await generateCustomDeviceFingerprint();
            if (!deviceFingerprint) throw new Error("Custom fingerprint generation returned null or empty.");
            // console.log("Custom Device Fingerprint:", deviceFingerprint);
            fpSuccess = true;
        } catch (error) {
            console.error('Custom Fingerprint Generation Error:', error);
            deviceFingerprint = null;
        }

        updateIPDisplayInternal(userIP, deviceFingerprint);

        if (ipSuccess && fpSuccess) {
            setLoginButtonState(false, 'Login');
            hideError();
        } else {
            setLoginButtonState(false, 'Retry');
            let errorMsg = 'Device identification failed. ';
            if (!ipSuccess) errorMsg += 'Could not determine IP address. ';
            if (!fpSuccess) errorMsg += 'Could not determine Device ID. ';
            errorMsg += 'Please refresh the page or ensure your browser allows scripts to run correctly (e.g., check for strict script blockers) and try again by clicking Retry.';
            showError(errorMsg);
        }
    };
    
    const updateIPDisplayInternal = (currentIP, currentFP) => {
        const displayValue = `IP: ${currentIP} | Device ID: ${currentFP ? currentFP.substring(0, 16) + '...' : 'Unavailable'}`;
        [dom.login.userIP, dom.payment.ip, dom.dashboard.ip].forEach(el => {
            if(el) el.textContent = displayValue;
        });
    };

    // --- Core Application Logic ---
    const verifyStudent = async () => {
        const studentId = dom.login.studentIdInput.value.trim();
        hideError();

        if (!studentId) {
            showError('Please enter your Student ID.');
            return;
        }

        if (!deviceFingerprint) {
            showError('Device identification has failed. Please refresh the page or ensure your browser allows scripts to run correctly and try again by clicking Retry.');
            setLoginButtonState(false, 'Retry');
            return;
        }

        setLoginButtonState(true, 'Processing...');

        try {
            const studentRef = sdk.ref(db, 'students/' + studentId);
            const snapshot = await sdk.get(studentRef);

            if (!snapshot.exists()) {
                setLoginButtonState(false, 'Login');
                return showError('Invalid Student ID. Please contact the administrator.');
            }

            const studentData = snapshot.val();
            currentStudent = { id: studentId, name: studentData.name || "Student" };

            const studentMaxDevices = typeof studentData.maxDeviceLimit === 'number' 
                                      ? studentData.maxDeviceLimit 
                                      : 2; 

            if (studentData.paid) {
                const devices = studentData.devices || {};
                let isAccessGranted = false;
                let matchedKey = null;

                if (devices[deviceFingerprint]) {
                     isAccessGranted = true;
                     matchedKey = deviceFingerprint;
                }

                if (isAccessGranted) {
                    if (devices[matchedKey] && devices[matchedKey].lastIP !== userIP) {
                         const deviceLastIPRef = sdk.child(studentRef, `devices/${matchedKey}/lastIP`);
                         await sdk.set(deviceLastIPRef, userIP);
                         const deviceLastSeenRef = sdk.child(studentRef, `devices/${matchedKey}/lastSeen`);
                         await sdk.set(deviceLastSeenRef, new Date().toISOString());
                    }
                    showDashboard();
                } else if (Object.keys(devices).length < studentMaxDevices) {
                    const newDeviceRef = sdk.child(studentRef, `devices/${deviceFingerprint}`);
                    await sdk.set(newDeviceRef, {
                        registeredAt: new Date().toISOString(),
                        initialIP: userIP,
                        lastIP: userIP,
                        userAgent: navigator.userAgent 
                    });
                    // console.log(`New device registered for ${studentId} with fingerprint: ${deviceFingerprint}`);
                    showDashboard();
                } else {
                    setLoginButtonState(false, 'Login');
                    showError(`🚫 Access Denied! This device is not authorized or you have reached the maximum device limit of ${studentMaxDevices}.`);
                }
            } else {
                showPayment();
            }
        } catch (error) {
            setLoginButtonState(false, 'Login');
            console.error("Firebase error:", error);
            if (error.code === 'PERMISSION_DENIED') {
                 showError('Security error. Could not save device info. Please contact admin.');
            } else {
                 showError('Error connecting to the server. Please check your connection.');
            }
        }
    };
    
    const logout = () => { 
        currentStudent = null; 
        currentSubject = null; 
        dom.login.studentIdInput.value = ''; 
        dom.watermark.style.opacity = '0'; 
        hideError(); 
        switchView(dom.login.section); 
        setLoginButtonState(false, 'Login'); 
        if (devToolsCheckInterval) { // Clear dev tools check on logout
            clearInterval(devToolsCheckInterval);
            devToolsCheckInterval = null;
        }
        dom.pdf.screenshotShield.style.display = 'none'; // Hide shield
        dom.body.classList.remove('content-hidden'); // Remove blur
        sessionStorage.removeItem('devToolsAlerted'); // Reset alert
        getDeviceAndNetworkInfo();
    };

    const showDashboard = () => { 
        dom.dashboard.name.textContent = currentStudent.name; 
        const watermarkText = `${currentStudent.id} | ${deviceFingerprint ? deviceFingerprint.substring(0, 10) : 'N/A'}`; 
        dom.watermark.textContent = watermarkText; 
        updateDynamicWatermark(); 
        dom.watermark.style.opacity = '1'; 
        populateSubjects(); 
        switchView(dom.dashboard.section); 
    };

    const showPayment = () => { 
        dom.payment.studentName.textContent = currentStudent.name; 
        dom.payment.studentId.textContent = currentStudent.id; 
        switchView(dom.payment.section); 
    };

    const populateSubjects = () => { 
        dom.dashboard.subjectsGrid.innerHTML = ''; 
        for (const code in pdfLinks) { 
            const subject = pdfLinks[code]; 
            const card = document.createElement('div'); 
            card.className = 'subject-card'; 
            card.innerHTML = `<div class="subject-icon">${subject.icon}</div><div class.subject-title">${code}</div><div class="subject-subtitle">${subject.name}</div>`; 
            card.addEventListener('click', () => selectSubject(code)); 
            dom.dashboard.subjectsGrid.appendChild(card); 
        } 
    };

    const selectSubject = (subjectCode) => { 
        currentSubject = subjectCode; 
        dom.ct.title.textContent = `${subjectCode} - ${pdfLinks[subjectCode].name}`; 
        populateCTs(subjectCode); 
        switchView(dom.ct.section); 
    };

    const populateCTs = (subjectCode) => { 
        dom.ct.grid.innerHTML = ''; 
        dom.ct.midtermSection.innerHTML = ''; 
        const subjectData = pdfLinks[subjectCode]; 
        ['CT1', 'CT2', 'CT3'].forEach(ctKey => { 
            const url = subjectData[ctKey]; 
            const card = document.createElement('div'); 
            card.className = 'ct-card'; 
            card.innerHTML = `<div class="ct-number">${ctKey.replace('CT','')}</div><div class="ct-title">${ctKey.replace('CT','CT - ')}</div>`; 
            if (url && url.trim() !== '') { 
                card.addEventListener('click', () => openPdf(`${subjectCode} - ${ctKey}`, url)); 
            } else { 
                card.classList.add('disabled'); 
            } 
            dom.ct.grid.appendChild(card); 
        }); 
        const midtermUrl = subjectData['Midterm']; 
        const midtermCard = document.createElement('div'); 
        midtermCard.className = 'midterm-card'; 
        midtermCard.innerHTML = `<div class="midterm-icon">📋</div><div class="midterm-title">Midterm Questions</div>`; 
        if (midtermUrl && midtermUrl.trim() !== '') { 
            midtermCard.addEventListener('click', () => openPdf(`${subjectCode} - Midterm`, midtermUrl)); 
        } else { 
            midtermCard.classList.add('disabled'); 
        } 
        dom.ct.midtermSection.appendChild(midtermCard); 
    };

    const updateDynamicWatermark = () => { 
        if (!currentStudent || !deviceFingerprint) return; 
        const watermarkText = `${currentStudent.id} | ${deviceFingerprint.substring(0,10)}`; 
        const container = dom.pdf.dynamicWatermarkContainer; 
        container.innerHTML = ''; 
        for (let i = 0; i < 50; i++) { 
            const tile = document.createElement('div'); 
            tile.className = 'watermark-tile'; 
            tile.textContent = watermarkText; 
            container.appendChild(tile); 
        } 
        container.style.opacity = '1'; 
    };

    const openPdf = (title, url) => { 
        currentPdfUrl = url; 
        dom.pdf.title.textContent = title; 
        dom.pdf.viewer.src = url; 
        updateDynamicWatermark(); 
        dom.pdf.section.classList.remove('hidden'); 
        dom.pdf.screenshotShield.style.display = 'block'; // Show shield

        checkDevTools(); // Initial check
        if (devToolsCheckInterval) clearInterval(devToolsCheckInterval);
        devToolsCheckInterval = setInterval(checkDevTools, 3000); // Check periodically
        sessionStorage.removeItem('devToolsAlerted'); // Reset alert status for new PDF view
    };

    const closePdf = () => { 
        if (document.fullscreenElement) { 
            document.exitFullscreen(); 
        } 
        dom.pdf.viewer.src = ''; 
        dom.pdf.dynamicWatermarkContainer.style.opacity = '0'; 
        dom.pdf.section.classList.add('hidden'); 
        dom.pdf.screenshotShield.style.display = 'none'; // Hide shield
        
        if (devToolsCheckInterval) {
            clearInterval(devToolsCheckInterval);
            devToolsCheckInterval = null;
        }
        dom.body.classList.remove('content-hidden'); // Ensure content is not hidden
        sessionStorage.removeItem('devToolsAlerted');
    };

    const downloadPDF = () => { 
        alert("For security, direct download is disabled. You can view the document here."); 
    };

    const toggleFullscreen = () => { 
        if (!document.fullscreenElement) { 
            dom.pdf.section.requestFullscreen().catch(err => alert(`Error: ${err.message}`)); 
        } else { 
            document.exitFullscreen(); 
        } 
    };

    let inactivityTimer; 
    const resetInactivityTimer = () => { 
        clearTimeout(inactivityTimer); 
        if (currentStudent) { 
            inactivityTimer = setTimeout(() => { 
                alert('Session expired due to inactivity.'); 
                logout(); 
            }, 30 * 60 * 1000); // 30 minutes 
        } 
    };
    
    // --- Security Measures ---
    const checkDevTools = () => {
        if (dom.pdf.section.classList.contains('hidden')) {
            if (devToolsCheckInterval) {
                clearInterval(devToolsCheckInterval);
                devToolsCheckInterval = null;
            }
            return;
        }

        const threshold = 160; // Heuristic for dev tools height/width
        const windowSizeMismatch = (window.outerWidth - window.innerWidth > threshold) ||
                                   (window.outerHeight - window.innerHeight > threshold);

        let consoleIsNotNative = false;
        if (window.console && typeof console.log === 'function') {
            if (!/\{\s*\[native code\]\s*\}/.test(Function.prototype.toString.call(console.log))) {
                consoleIsNotNative = true; 
            }
        } else {
             consoleIsNotNative = true; // No console or console.log is not a function
        }
        
        if (windowSizeMismatch || consoleIsNotNative) {
            if (!dom.body.classList.contains('content-hidden')) {
                dom.body.classList.add('content-hidden');
                // console.warn("Developer tools detected or console modified. PDF content obscured.");
                if (!sessionStorage.getItem('devToolsAlerted')) {
                    alert("Developer tools or console modifications are not permitted while viewing documents. Content will be obscured. Please close them and refresh if needed to clear this state.");
                    sessionStorage.setItem('devToolsAlerted', 'true');
                }
            }
        } else {
            // If not blurred by dev tools, and window has focus, remove blur
            // This is mainly handled by the window.focus event listener
        }
    };

    const setupSecurityListeners = () => {
        document.addEventListener('contextmenu', e => {
            if (!dom.pdf.section.classList.contains('hidden')) {
                e.preventDefault();
            }
        });

        document.addEventListener('selectstart', e => {
            if (!dom.pdf.section.classList.contains('hidden')) {
                 e.preventDefault();
            }
        });

        document.addEventListener('keydown', e => {
            if (dom.pdf.section.classList.contains('hidden')) return;

            const key = e.key.toLowerCase();
            const ctrlOrCmd = e.ctrlKey || e.metaKey;

            // Developer Tools shortcuts
            if (key === 'f12' ||
                (ctrlOrCmd && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) ||
                (e.metaKey && e.altKey && (key === 'i' || key === 'j')) // Mac Option+Cmd+I/J for dev tools
            ) {
                e.preventDefault();
                checkDevTools(); // Immediately run check and potentially blur
                return;
            }

            // Prevent Saving page (Ctrl+S), Printing (Ctrl+P), View Source (Ctrl+U)
            if (ctrlOrCmd && (key === 's' || key === 'p' || key === 'u')) {
                e.preventDefault();
                return;
            }
            
            // Attempt to block PrintScreen (highly unreliable, OS-level)
            if (key === 'printscreen' || key === 'snapshot') { // 'snapshot' for some Firefox versions/media keys
                e.preventDefault();
                // console.warn("PrintScreen key press detected (attempted block). This is unreliable.");
                return;
            }
        });

        window.addEventListener('blur', () => { 
            if (!dom.pdf.section.classList.contains('hidden')) { 
                dom.body.classList.add('content-hidden'); 
                // console.log("Window lost focus, PDF content obscured.");
            } 
        });

        window.addEventListener('focus', () => { 
            if (!dom.pdf.section.classList.contains('hidden')) {
                 // Temporarily remove blur, checkDevTools will re-apply if needed
                dom.body.classList.remove('content-hidden');
                checkDevTools(); 
                // console.log("Window gained focus, re-checking security for PDF.");
            }
        });

        document.addEventListener('click', resetInactivityTimer);
        document.addEventListener('keypress', resetInactivityTimer);
    };
    
    // --- Initialization ---
    const init = async () => {
        dom.login.loginBtn.addEventListener('click', verifyStudent);
        dom.login.studentIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') verifyStudent();
        });
        dom.payment.backBtn.addEventListener('click', logout);
        dom.dashboard.logoutBtn.addEventListener('click', logout);
        dom.ct.backBtn.addEventListener('click', showDashboard);
        dom.pdf.backBtn.addEventListener('click', closePdf);
        dom.pdf.downloadBtn.addEventListener('click', downloadPDF);
        dom.pdf.fullscreenBtn.addEventListener('click', toggleFullscreen);
        
        await getDeviceAndNetworkInfo();
        setupSecurityListeners();
        switchView(dom.login.section);
    };

    init();
}

// DOM রেডি হলে মূল অ্যাপটি চালু হবে
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runApp);
} else {
    runApp();
}


