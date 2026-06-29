@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
    --bg-base: #f8fafc;
    --glass-bg: rgba(255, 255, 255, 0.7);
    --glass-border: rgba(255, 255, 255, 0.5);
    --glass-shadow: 0 8px 32px rgba(15, 23, 42, 0.04);
    --primary-gradient: linear-gradient(135deg, #0061ff 0%, #60efff 100%);
    --primary-glow: 0 10px 25px -5px rgba(0, 97, 255, 0.4);
    --text-main: #0f172a;
    --text-muted: #475569;
    --transition-smooth: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Base & Typography */
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
    background-color: var(--bg-base) !important;
    color: var(--text-main) !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
    animation: fadeIn 0.8s ease-out forwards;
}

h1, h2, h3, h4, h5, h6, [class*="text-2xl"], [class*="text-3xl"], [class*="text-4xl"] {
    font-weight: 700 !important;
    letter-spacing: -0.03em !important;
    line-height: 1.2 !important;
    color: var(--text-main) !important;
}

p, span, [class*="text-sm"], [class*="text-base"] {
    line-height: 1.6 !important;
    letter-spacing: 0.01em !important;
}

/* Animated Gradient Background */
body::before, body::after {
    content: '';
    position: fixed;
    z-index: -1;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.6;
    animation: blobFloat 15s infinite alternate ease-in-out;
}

body::before {
    top: -10%;
    left: -10%;
    width: 60vw;
    height: 60vw;
    background: radial-gradient(circle, #e0c3fc 0%, #8ec5fc 100%);
}

body::after {
    bottom: -15%;
    right: -10%;
    width: 50vw;
    height: 50vw;
    background: radial-gradient(circle, #8ec5fc 0%, #e0c3fc 100%);
    animation-delay: -7s;
}

/* Glassmorphism Panels (Targeting main containers & specific classes) */
main, section, .glass-panel, [class*="bg-white"] {
    background: var(--glass-bg) !important;
    backdrop-filter: blur(20px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
    border: 1px solid var(--glass-border) !important;
    border-radius: 24px !important;
    box-shadow: var(--glass-shadow) !important;
}

/* Tool Cards */
.tool-card, [class*="grid"] > div, [class*="card"] {
    background: rgba(255, 255, 255, 0.85) !important;
    backdrop-filter: blur(12px) !important;
    border-radius: 18px !important;
    border: 1px solid rgba(255, 255, 255, 0.9) !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02) !important;
    transition: var(--transition-smooth) !important;
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    position: relative;
    z-index: 1;
}

/* Staggered entrance for cards */
[class*="grid"] > div:nth-child(1) { animation-delay: 0.1s; }
[class*="grid"] > div:nth-child(2) { animation-delay: 0.2s; }
[class*="grid"] > div:nth-child(3) { animation-delay: 0.3s; }
[class*="grid"] > div:nth-child(4) { animation-delay: 0.4s; }
[class*="grid"] > div:nth-child(5) { animation-delay: 0.5s; }

.tool-card:hover, [class*="grid"] > div:hover, [class*="card"]:hover {
    transform: translateY(-8px) scale(1.02) !important;
    box-shadow: 0 20px 40px rgba(0, 97, 255, 0.08), 0 0 0 1px rgba(0, 97, 255, 0.1) inset !important;
    background: #ffffff !important;
    z-index: 10;
}

/* Buttons */
button, a[class*="bg-blue"], .btn-primary {
    background: var(--primary-gradient) !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 12px !important;
    font-weight: 600 !important;
    letter-spacing: 0.02em !important;
    transition: var(--transition-smooth) !important;
    box-shadow: 0 4px 12px rgba(0, 97, 255, 0.2) !important;
    text-transform: capitalize;
    position: relative;
    overflow: hidden;
}

button:hover, a[class*="bg-blue"]:hover, .btn-primary:hover {
    transform: translateY(-2px) !important;
    box-shadow: var(--primary-glow) !important;
}

button:active, a[class*="bg-blue"]:active, .btn-primary:active {
    transform: translateY(1px) !important;
    box-shadow: 0 2px 5px rgba(0, 97, 255, 0.2) !important;
}

button[type="submit"], [class*="animate-pulse"], .cta-btn {
    animation: pulseCTA 2.5s infinite cubic-bezier(0.66, 0, 0, 1) !important;
}

/* Active Tool Panel / Modal */
.active-tool-panel, [class*="fixed"][class*="inset-0"] > div {
    background: rgba(255, 255, 255, 0.9) !important;
    backdrop-filter: blur(25px) !important;
    border: 1px solid rgba(0, 97, 255, 0.15) !important;
    border-radius: 24px !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.6) !important;
    animation: modalEntrance 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
}

/* Dropzone */
.dropzone, #dropzone, [class*="border-dashed"] {
    border: 2px dashed rgba(0, 97, 255, 0.3) !important;
    border-radius: 20px !important;
    background: rgba(248, 250, 252, 0.6) !important;
    transition: var(--transition-smooth) !important;
    position: relative;
    overflow: hidden;
}

.dropzone:hover, #dropzone:hover, [class*="border-dashed"]:hover {
    border-color: #0061ff !important;
    background: rgba(0, 97, 255, 0.03) !important;
    animation: borderDance 1.5s infinite alternate ease-in-out;
}

/* Footer & UI Polish */
footer, [class*="mt-auto"] {
    border-top: 1px solid rgba(226, 232, 240, 0.6) !important;
    background: transparent !important;
    padding-top: 2rem !important;
    margin-top: 4rem !important;
}

hr, [class*="border-t"] {
    border-color: rgba(226, 232, 240, 0.6) !important;
}

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes modalEntrance {
    from { opacity: 0; transform: translateY(30px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes pulseCTA {
    0% { box-shadow: 0 0 0 0 rgba(0, 97, 255, 0.4); }
    70% { box-shadow: 0 0 0 12px rgba(0, 97, 255, 0); }
    100% { box-shadow: 0 0 0 0 rgba(0, 97, 255, 0); }
}

@keyframes borderDance {
    0% { box-shadow: inset 0 0 0 rgba(0, 97, 255, 0); }
    100% { box-shadow: inset 0 0 20px rgba(0, 97, 255, 0.08); border-color: rgba(0, 97, 255, 0.6) !important; }
}

@keyframes blobFloat {
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(40px, -60px) scale(1.1); }
    66% { transform: translate(-30px, 30px) scale(0.9); }
    100% { transform: translate(0, 0) scale(1); }
}

/* Mobile Enhancements */
@media (max-width: 768px) {
    body::before, body::after {
        filter: blur(80px);
        opacity: 0.4;
    }
    
    main, section, .glass-panel, [class*="bg-white"] {
        border-radius: 20px !important;
        padding: 1.5rem !important;
    }

    .tool-card:hover, [class*="grid"] > div:hover, [class*="card"]:hover {
        transform: translateY(-3px) scale(1.01) !important;
        box-shadow: 0 10px 20px rgba(0, 97, 255, 0.05) !important;
    }

    button:hover, a[class*="bg-blue"]:hover {
        transform: none !important;
    }
    
    [class*="p-8"], [class*="p-10"], [class*="p-12"] {
        padding: 1.5rem !important;
    }
}
