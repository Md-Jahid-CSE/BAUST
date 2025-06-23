// =================================================================================
// University Student Portal - Main Script
// Version: 3.0.0 (WebView with Print-to-PDF integration)
// =================================================================================

// --- MODULES ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getDatabase, ref, get, set, child, update } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-database.js";

// --- CONFIGURATION ---
const mainAppConfig = {
    apiKey: "AIzaSyBUq_szwEsm50CLZRxUiD6CmXNiB3OwNRc",
    authDomain: "ctquestions-ac5f2.firebaseapp.com",
    databaseURL: "https://ctquestions-ac5f2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ctquestions-ac5f2",
    storageBucket: "ctquestions-ac5f2.appspot.com",
    messagingSenderId: "421824009186",
    appId: "1:421824009186:web:298554ad147781e6ec5fbb"
};
const resultsAppConfig = {
    apiKey: "AIzaSyBepFrALgJkuoF-dcPtf93_86jpNTu4plA",
    authDomain: "result-for-apps.firebaseapp.com",
    databaseURL: "https://result-for-apps-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "result-for-apps",
    storageBucket: "result-for-apps.appspot.com",
    messagingSenderId: "1093518048625",
    appId: "1:1093518048625:web:005d02b0ce92aa3a358ad0"
};

// --- STATIC DATA ---
const pdfLinks = {
    "MATH 1243": { name: "Ordinary and Partial Differential Equation", icon: "📊", 
        CT1: "https://drive.google.com/file/d/1L-8tdiVc7C4CwIsVELbvhIGE90TnEw0V/preview", 
        CT2: "https://drive.google.com/file/d/1qsfMQirr_VpVNbqueZQMLSz_KCzNEYlX/preview", 
        CT3: "https://drive.google.com/file/d/1BFJ7Z6BfViMETylxGeD27MC6Cz1nSdQs/preview", 
        Midterm: "https://drive.google.com/file/d/1i0y4tIeOTsOg-ueouUjEBNRmywzehcMo/preview", 
        ClassNote: "" },

    "CSE 1201": { name: "Discrete Mathematics", icon: "⚛️", 
        CT1: "https://drive.google.com/file/d/1YiooY2EoNCQnxBIUtpwBPlNN6EyhXrHo/preview", 
        CT2: "https://drive.google.com/file/d/1nu_zk9K_u1iqxUZwVVbjo04ahhqkCzlw/preview", 
        CT3: "https://drive.google.com/file/d/11WHnK01vHiMX9GyfKdXz1XCn02Yh7Qbl/preview", 
        Midterm: "https://drive.google.com/file/d/1m7zLsxptGDzxI0s2GOgKruv-mHMAG4fB/preview", 
        ClassNote: "" },

    "CSE 1203": { name: "Object-Oriented Programming", icon: "💻", 
        CT1: "https://drive.google.com/file/d/1bZjSPt-tnvW2m_3bt-LM9BnHESArDK7E/preview", 
        CT2: "https://drive.google.com/file/d/13mxyCGTPO7b2fyfXZKAPC0F-qBC9B1oU/preview", 
        CT3: "https://drive.google.com/file/d/1BxP2tSe19MIsEGH4IWT9nbaAVz9M1JtQ/preview", 
        Midterm: "https://drive.google.com/file/d/1VJLJw8pNQ39dWUzPBszPmckwDlSmHiKw/preview", 
        ClassNote: "" },

    "EEE 1269": { name: "Electronic Circuits", icon: "⚡", 
        CT1: "https://drive.google.com/file/d/1i8xLt0VTTo-hQIj-SxqNZqPXReCnmfqu/preview", 
        CT2: "https://drive.google.com/file/d/1ZVF-8NanBU_osiTwMpKrY87EiNv4jN_Q/preview", 
        CT3: "https://drive.google.com/file/d/1iM3ursihn1hqJn4qww6weUM8fSTEEGAf/preview", 
        Midterm: "https://drive.google.com/file/d/1FFCt-SsWx5szpdnXczJxjWr1mC5diCHG/preview", 
        ClassNote: "" },

    "HUM 1221": { name: "Bengali Language and Literature", icon: "🌱", 
        CT1: "", 
        CT2: "", 
        CT3: "", 
        Midterm: "", 
        ClassNote: "" }
};

// --- MAIN APPLICATION ---
function runApp() {
    // Application state
    const appState = {
        userIP: null,
        deviceFingerprint: null,
        currentStudent: null,
        currentSubject: null,
        devToolsCheckInterval: null
    };

    // Firebase instances
    const mainApp = initializeApp(mainAppConfig);
    const resultsApp = initializeApp(resultsAppConfig, "resultsApp");
    const mainDb = getDatabase(mainApp);
    const resultsDb = getDatabase(resultsApp);
    const sdk = { ref, get, set, child, update };

    // DOM element cache
    const dom = {
        body: document.body,
        login: { section: document.getElementById('loginSection'), input: document.getElementById('studentIdInput'), btn: document.getElementById('loginBtn'), btnText: document.querySelector('#loginBtn .btn-text'), loader: document.querySelector('#loginBtn .btn-loader'), error: document.getElementById('loginError'), ipDisplay: document.getElementById('userIP') },
        payment: { section: document.getElementById('paymentSection'), backBtn: document.getElementById('paymentBackBtn'), studentName: document.getElementById('studentName'), studentId: document.getElementById('paymentStudentId'), ipDisplay: document.getElementById('paymentIP') },
        dashboard: { section: document.getElementById('dashboardSection'), logoutBtn: document.getElementById('dashboardLogoutBtn'), nameDisplay: document.getElementById('dashboardName'), ipDisplay: document.getElementById('dashboardIP'), subjectsGrid: document.getElementById('subjectsGrid') },
        resultsPage: { section: document.getElementById('resultsPageSection'), backBtn: document.getElementById('resultsBackBtn'), container: document.getElementById('resultsPageContainer'), downloadBtn: document.getElementById('downloadResultBtn') },
        ct: { section: document.getElementById('ctSection'), backBtn: document.getElementById('ctBackBtn'), title: document.getElementById('subjectTitle'), grid: document.getElementById('ctGrid'), midtermSection: document.getElementById('midtermSection'), classNoteSection: document.getElementById('classNoteSection') },
        pdf: { section: document.getElementById('pdfSection'), backBtn: document.getElementById('pdfBackBtn'), title: document.getElementById('pdfTitle'), fullscreenBtn: document.getElementById('fullscreenBtn'), downloadBtn: document.getElementById('downloadBtn'), viewer: document.getElementById('pdfViewer'), shield: document.getElementById('screenshotShield') },
    };
    
    // --- UI & STATE UTILITIES ---
    const switchView = (targetView) => {
        document.querySelectorAll('.section-view, .pdf-fullscreen').forEach(s => s.classList.remove('active-view'));
        if (targetView) {
            targetView.classList.add('active-view');
        }
    };

    const showError = (message, element = dom.login.error) => {
        element.textContent = message;
        element.classList.remove('hidden');
    };

    const hideError = (element = dom.login.error) => {
        element.classList.add('hidden');
    };

    const setButtonState = (button, textSpan, loader, isLoading, text) => {
        button.disabled = isLoading;
        textSpan.textContent = text;
        loader.classList.toggle('hidden', !isLoading);
        textSpan.classList.toggle('hidden', isLoading);
    };

    // --- BACKGROUND & UI EFFECTS (PERFORMANCE OPTIMIZED) ---
    const setupCosmicEffects = () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const isMobile = window.innerWidth <= 768;

        const createElements = (containerId, count, className, configure) => {
            const container = document.getElementById(containerId);
            if (!container) return;

            const fragment = document.createDocumentFragment();
            for (let i = 0; i < count; i++) {
                const el = document.createElement('div');
                el.className = className;
                configure(el, i);
                fragment.appendChild(el);
            }
            container.appendChild(fragment);
        };

        // OPTIMIZED: Reduced element counts for better performance on mobile/webview
        const starCount = isMobile ? 30 : 80;
        const particleCount = isMobile ? 20 : 50;

        createElements('stars', starCount, 'star', (el) => {
            el.style.width = `${Math.random() * 2 + 1}px`; // Slightly smaller stars
            el.style.height = el.style.width;
            el.style.left = `${Math.random() * 100}%`;
            el.style.top = `${Math.random() * 100}%`;
            el.style.animationDelay = `${Math.random() * 6}s`;
            el.style.animationDuration = `${Math.random() * 4 + 3}s`;
        });

        createElements('particles', particleCount, 'particle', (el) => {
            el.style.width = `${Math.random() * 5 + 1}px`; // Slightly smaller particles
            el.style.height = el.style.width;
            el.style.left = `${Math.random() * 100}%`;
            el.style.top = `${Math.random() * 100}%`;
            el.style.animationDelay = `${Math.random() * 12}s`;
            const colors = ['rgba(79,172,254,0.7)', 'rgba(0,242,254,0.7)', 'rgba(168,237,234,0.7)'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            el.style.background = `radial-gradient(circle, ${color}, transparent)`;
        });

        const wavesContainer = document.getElementById('waves');
        if (wavesContainer && !isMobile) {
            // OPTIMIZED: Increased interval to reduce frequency of DOM manipulation
            setInterval(() => {
                const wave = document.createElement('div');
                wave.className = 'wave';
                const colors = ['rgba(79,172,254,0.2)', 'rgba(168,85,247,0.2)']; // Less opaque
                wave.style.borderColor = colors[Math.floor(Math.random() * colors.length)];
                wavesContainer.appendChild(wave);
                setTimeout(() => wave.remove(), 4000);
            }, 8000); // Was 3000ms
        }
    };

    // --- CORE LOGIC (UNCHANGED) ---
    const getDeviceAndNetworkInfo = async () => {
        setButtonState(dom.login.btn, dom.login.btnText, dom.login.loader, true, "Initializing...");
        
        const fetchIP = async () => {
            try {
                const response = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) });
                return response.ok ? (await response.json()).ip : 'Unavailable';
            } catch {
                return 'Unavailable';
            }
        };
        
        const generateFingerprint = async () => {
            async function sha256(str) {
                if (typeof crypto === 'undefined' || !crypto.subtle) {
                    let hash = 0;
                    for (let i = 0; i < str.length; i++) {
                        hash = ((hash << 5) - hash) + str.charCodeAt(i);
                        hash |= 0;
                    }
                    return Math.abs(hash).toString(16);
                }
                const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
                return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
            }
            const components = [
                `ua:${navigator.userAgent || 'N/A'}`,
                `lang:${navigator.language || 'N/A'}`,
                `screen:${screen.width || 0}x${screen.height || 0}`
            ];
            return `customfp_${await sha256(components.join('||'))}`;
        };
        
        [appState.userIP, appState.deviceFingerprint] = await Promise.all([fetchIP(), generateFingerprint()]);
        
        updateIPDisplay();

        if (appState.userIP === 'Unavailable' || !appState.deviceFingerprint) {
            showError("Failed to identify device. Check connection and refresh.");
            setButtonState(dom.login.btn, dom.login.btnText, dom.login.loader, true, "Retry");
        } else {
            setButtonState(dom.login.btn, dom.login.btnText, dom.login.loader, false, "Login");
        }
    };

    const handleLogin = async () => {
        const studentId = dom.login.input.value.trim();
        hideError();

        if (!studentId) {
            return showError('Student ID cannot be empty.');
        }
        if (!appState.deviceFingerprint) {
            return showError('Device not identified. Please refresh.');
        }

        setButtonState(dom.login.btn, dom.login.btnText, dom.login.loader, true, "Verifying...");

        try {
            const studentRef = sdk.ref(mainDb, `students/${studentId}`);
            const studentSnapshot = await sdk.get(studentRef);
            
            if (!studentSnapshot.exists()) {
                const resultSnapshot = await sdk.get(sdk.ref(resultsDb, `results/${studentId}`));
                if (resultSnapshot.exists()) {
                    appState.currentStudent = { id: studentId, name: resultSnapshot.val().name || "Student" };
                    renderPaymentView();
                } else {
                    showError('Invalid Student ID. Please contact the administrator.');
                    setButtonState(dom.login.btn, dom.login.btnText, dom.login.loader, false, "Login");
                }
                return;
            }

            const studentData = studentSnapshot.val();
            appState.currentStudent = { id: studentId, name: studentData.name || "Student" };

            if (!studentData.paid) {
                renderPaymentView();
                return;
            }

            const devices = studentData.devices || {};
            const maxDeviceLimit = typeof studentData.maxDeviceLimit === 'number' ? studentData.maxDeviceLimit : 2;
            const deviceRef = sdk.child(studentRef, `devices/${appState.deviceFingerprint}`);
            
            if (devices[appState.deviceFingerprint]) {
                const updates = {
                    lastIP: appState.userIP,
                    lastSeen: new Date().toISOString()
                };
                await sdk.update(deviceRef, updates);
                renderDashboard();
            } else {
                if (Object.keys(devices).length < maxDeviceLimit) {
                    await sdk.set(deviceRef, {
                        registeredAt: new Date().toISOString(),
                        initialIP: appState.userIP,
                        lastIP: appState.userIP,
                        userAgent: navigator.userAgent,
                        lastSeen: new Date().toISOString(),
                        ipMismatchCount: 0
                    });
                    renderDashboard();
                } else {
                    showError(`Access Denied! Maximum device limit of ${maxDeviceLimit} has been reached.`);
                    setButtonState(dom.login.btn, dom.login.btnText, dom.login.loader, false, "Login");
                }
            }
        } catch (error) {
            console.error("Login Error:", error);
            showError(`An error occurred. Please try again.`);
            setButtonState(dom.login.btn, dom.login.btnText, dom.login.loader, false, "Login");
        }
    };
    
    const handleLogout = () => {
        appState.currentStudent = null;
        appState.currentSubject = null;
        dom.login.input.value = '';
        hideError();
        switchView(dom.login.section);
        setButtonState(dom.login.btn, dom.login.btnText, dom.login.loader, false, "Login");
        if (appState.devToolsCheckInterval) {
            clearInterval(appState.devToolsCheckInterval);
        }
    };

    // --- VIEW RENDERING (UNCHANGED) ---
    const renderDashboard = () => {
        dom.dashboard.nameDisplay.textContent = appState.currentStudent.name;
        const grid = dom.dashboard.subjectsGrid;
        grid.innerHTML = '';
        
        const fragment = document.createDocumentFragment();
        fragment.appendChild(createCard('result-card', '🏆', 'View Results', 'Check your academic performance', renderResultsPage));
        
        for (const code in pdfLinks) {
            const subject = pdfLinks[code];
            if (subject.name) {
                fragment.appendChild(createCard('subject-card', subject.icon, code, subject.name, () => renderCtView(code)));
            }
        }
        
        grid.appendChild(fragment);
        switchView(dom.dashboard.section);
    };

    const renderResultsPage = async () => {
        switchView(dom.resultsPage.section);
        dom.resultsPage.container.innerHTML = `<div class="loader">Fetching your results...</div>`;
        dom.resultsPage.downloadBtn.classList.add('hidden');

        try {
            const resultRef = sdk.ref(resultsDb, `results/${appState.currentStudent.id}`);
            const snapshot = await sdk.get(resultRef);

            if (!snapshot.exists()) {
                dom.resultsPage.container.textContent = 'No result data found for your ID.';
                return;
            }
            
            const data = snapshot.val();
            const subjects = data.subjects || {};
            const attendances = data.attendance || {};
            
            const table = document.createElement('table');
            table.className = 'result-table';
            table.id = 'result-table-for-pdf';
            table.innerHTML = `<thead><tr><th>Subject</th><th>CT-1</th><th>CT-2</th><th>CT-3</th><th>Midterm</th><th>Attendance</th><th>Total</th></tr></thead><tbody></tbody>`;
            
            const tbody = table.querySelector('tbody');

            const formatMark = (mark) => (mark === null || mark === undefined || mark === "") ? 'N/A' : mark;

            Object.keys(pdfLinks).forEach(code => {
                const subjectData = subjects[code] || {};
                const attendanceMark = attendances[code];
                
                const total = (Number(subjectData.ct1) || 0) + (Number(subjectData.ct2) || 0) + (Number(subjectData.ct3) || 0) + (Number(subjectData.midterm) || 0);
                
                const row = tbody.insertRow();
                
                row.innerHTML = `
                    <td>${pdfLinks[code]?.name || code}</td>
                    <td>${formatMark(subjectData.ct1)}</td>
                    <td>${formatMark(subjectData.ct2)}</td>
                    <td>${formatMark(subjectData.ct3)}</td>
                    <td>${formatMark(subjectData.midterm)}</td>
                    <td>${formatMark(attendanceMark)}</td>
                    <td><strong>${total}</strong></td>
                `;
            });

            dom.resultsPage.container.innerHTML = '';
            dom.resultsPage.container.appendChild(table);
            dom.resultsPage.downloadBtn.classList.remove('hidden');
        } catch (error) {
            console.error("Result Fetch Error:", error);
            dom.resultsPage.container.innerHTML = `<p class="error">Could not load results.</p>`;
        }
    };

    const renderPaymentView = () => {
        dom.payment.studentName.textContent = appState.currentStudent.name;
        dom.payment.studentId.textContent = appState.currentStudent.id;
        switchView(dom.payment.section);
    };
    
    const renderCtView = (subjectCode) => {
        appState.currentSubject = subjectCode;
        dom.ct.title.textContent = `${subjectCode} - ${pdfLinks[subjectCode].name}`;
        dom.ct.grid.innerHTML = '';
        
        ['CT1', 'CT2', 'CT3'].forEach(ctKey => {
            const url = pdfLinks[subjectCode][ctKey];
            const number = ctKey.replace('CT', '');
            dom.ct.grid.appendChild(createCtCard(number, `Class Test ${number}`, url ? () => renderPdfView(`${subjectCode} - ${ctKey}`, url) : null));
        });
        
        // --- FIX START ---
        // Cleared old content and used appendChild to preserve click events.
        dom.ct.midtermSection.innerHTML = '';
        dom.ct.classNoteSection.innerHTML = '';

        dom.ct.midtermSection.appendChild(
            createSpecialCard('midterm-card', '📋', 'Midterm', pdfLinks[subjectCode]['Midterm'], () => renderPdfView(`${subjectCode} - Midterm`, pdfLinks[subjectCode]['Midterm']))
        );
        dom.ct.classNoteSection.appendChild(
            createSpecialCard('note-card', '🗒️', 'Class Notes', pdfLinks[subjectCode]['ClassNote'], () => renderPdfView(`${subjectCode} - Class Note`, pdfLinks[subjectCode]['ClassNote']))
        );
        // --- FIX END ---
        
        switchView(dom.ct.section);
    };

    const renderPdfView = (title, url) => {
        dom.pdf.title.textContent = title;
        dom.pdf.viewer.src = url;
        dom.pdf.section.classList.add('active-view');
        dom.pdf.shield.style.display = 'block';
        
        if (appState.devToolsCheckInterval) clearInterval(appState.devToolsCheckInterval);
        appState.devToolsCheckInterval = setInterval(checkDevTools, 3000);
    };
    
    const closePdfView = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        dom.pdf.viewer.src = 'about:blank';
        dom.pdf.section.classList.remove('active-view');
        dom.pdf.shield.style.display = 'none';
        
        if (appState.devToolsCheckInterval) {
            clearInterval(appState.devToolsCheckInterval);
        }
        dom.body.classList.remove('content-hidden');
    };

    // --- ELEMENT CREATORS (UNCHANGED) ---
    const createCard = (className, icon, title, subtitle, onClick) => {
        const card = document.createElement('div');
        card.className = `subject-card ${className}`;
        card.innerHTML = `<div class="card-icon">${icon}</div><div class="card-title">${title}</div><div class="card-subtitle">${subtitle}</div>`;
        card.onclick = onClick;
        return card;
    };

    const createCtCard = (number, title, onClick) => {
        const card = document.createElement('div');
        card.className = 'ct-card';
        card.innerHTML = `<div class="ct-number">${number}</div><div class="ct-title">${title}</div>`;
        if (onClick) {
            card.onclick = onClick;
        } else {
            card.classList.add('disabled');
            card.innerHTML += `<span class="disabled-text">Not Available</span>`;
        }
        return card;
    };

    const createSpecialCard = (className, icon, title, url, onClick) => {
        const card = document.createElement('div');
        card.className = `special-card ${className}`;
        // --- FIX START ---
        // Corrected the broken HTML for the icon div from `class.` to `class=`.
        card.innerHTML = `<div class="card-icon">${icon}</div><div class="card-title">${title}</div>`;
        // --- FIX END ---
        if (url) {
            card.onclick = onClick;
        } else {
            card.classList.add('disabled');
            card.innerHTML += `<span class="disabled-text">Not Available</span>`;
        }
        return card;
    };
    
    // --- PDF & SECURITY (UNCHANGED) ---
    const downloadResultAsPdf = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Academic Result", doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Student Name: ${appState.currentStudent.name}`, 14, 35);
        doc.text(`Student ID: ${appState.currentStudent.id}`, 14, 41);
        
        doc.autoTable({
            html: '#result-table-for-pdf',
            startY: 48,
            theme: 'grid',
            headStyles: { fillColor: [79, 172, 254] }
        });
        
        try {
            // PDF এর ডেটা Base64 স্ট্রিং হিসাবে নেওয়া হচ্ছে
            const pdfData = doc.output('datauristring');
            
            // Android অ্যাপের সাথে সংযোগ করার জন্য 'Android' ইন্টারফেস কল করা হচ্ছে
            if (window.Android && typeof window.Android.printPdf === 'function') {
                // Base64 ডেটা থেকে অপ্রয়োজনীয় অংশ বাদ দেওয়া হচ্ছে
                const base64Pdf = pdfData.substring(pdfData.indexOf(',') + 1);
                window.Android.printPdf(base64Pdf);
            } else {
                // যদি অ্যাপের বাইরে (ব্রাউজারে) চলে, তাহলে আগের মতো কাজ করবে
                doc.save(`Result_${appState.currentStudent.id}.pdf`);
            }
        } catch (e) {
            alert("Could not generate PDF. Error: " + e.message);
        }
    };

    const updateIPDisplay = () => {
        const fp = appState.deviceFingerprint;
        const displayValue = `IP: ${appState.userIP || 'N/A'} | Device: ${fp ? fp.substring(9, 21) : 'N/A'}`;
        [dom.login.ipDisplay, dom.payment.ipDisplay, dom.dashboard.ipDisplay].forEach(el => {
            if (el) el.textContent = displayValue;
        });
    };

    const checkDevTools = () => {
        const isOpen = (window.outerWidth - window.innerWidth > 160) || (window.outerHeight - window.innerHeight > 160);
        dom.body.classList.toggle('content-hidden', isOpen);
    };
    
    // --- INITIALIZATION (UNCHANGED) ---
    const addEventListeners = () => {
        dom.login.btn.addEventListener('click', handleLogin);
        dom.login.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
        dom.dashboard.logoutBtn.addEventListener('click', handleLogout);
        dom.payment.backBtn.addEventListener('click', handleLogout);
        dom.resultsPage.backBtn.addEventListener('click', renderDashboard);
        dom.ct.backBtn.addEventListener('click', renderDashboard);
        dom.pdf.backBtn.addEventListener('click', closePdfView);
        dom.pdf.fullscreenBtn.addEventListener('click', () => {
            dom.pdf.section.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
        });
        dom.pdf.downloadBtn.addEventListener('click', () => alert('Direct download is disabled.'));
        dom.resultsPage.downloadBtn.addEventListener('click', downloadResultAsPdf);
    };

    const init = async () => {
        addEventListeners();
        setupCosmicEffects();
        switchView(dom.login.section);
        await getDeviceAndNetworkInfo();
    };

    init();
}

// Run the application
document.addEventListener('DOMContentLoaded', runApp);
