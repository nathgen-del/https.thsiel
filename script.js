// ==========================================
// 1. WISTERIA INTERACTIVE BACKGROUND GLOW (DESKTOP & MOBILE TOUCH)
// ==========================================
let ticking = false;

function updateGlowPosition(clientX, clientY) {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const mouseX = (clientX / window.innerWidth) * 100;
            const mouseY = (clientY / window.innerHeight) * 100;

            document.documentElement.style.setProperty('--mouse-x', `${mouseX}%`);
            document.documentElement.style.setProperty('--mouse-y', `${mouseY}%`);
            ticking = false;
        });
        ticking = true;
    }
}

// Listens for desktop mouse movement
document.addEventListener("mousemove", (e) => {
    updateGlowPosition(e.clientX, e.clientY);
});

// Listens for mobile finger swiping
document.addEventListener("touchmove", (e) => {
    updateGlowPosition(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true }); // passive:true keeps mobile scrolling smooth


// ==========================================
// 2. SINGLE PAGE APP NAVIGATION LOGIC
// ==========================================
const navLinks = document.querySelectorAll('.topbar-nav a, .mobile-dock a');
const views = document.querySelectorAll('.view');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all links and views
        navLinks.forEach(l => l.classList.remove('active'));
        views.forEach(v => v.classList.remove('active-view'));

        // Add active class to clicked link
        link.classList.add('active');

        // Find the matching view and activate it
        const targetId = link.getAttribute('href').substring(1);
        document.getElementById(targetId).classList.add('active-view');
    });
});


// ==========================================
// 3. FULLY WORKING DIGITAL TAMAGOTCHI
// ==========================================
const pet = document.getElementById('cyber-pet');
const petFace = document.getElementById('pet-face');
const petDialogue = document.getElementById('pet-dialogue');
const petMenu = document.getElementById('pet-menu');
const moodText = document.getElementById('mood-text');
const hungerText = document.getElementById('hunger-text');

if (pet && petFace) {
    // PET STATE (The Brain)
    let state = {
        hunger: 0,       // 0 = full, 10 = starving
        happiness: 10,   // 10 = overjoyed, 0 = depressed
        isSleeping: false,
        isPaused: false  // Stops roaming when you open the menu
    };

    let petX = 10;
    let direction = 1;
    let speed = 0.5;

    // FACIAL EXPRESSIONS
    const faces = {
        normal: "/\\_/\\<br>( o.o )<br> > ^ <",
        happy: "/\\_/\\<br>( ^.^ )<br> > ^ <",
        eating: "/\\_/\\<br>( o_o ) 🍙<br> > ^ <",
        sleeping: "/\\_/\\<br>( -.- )<br> > ^ <",
        sad: "/\\_/\\<br>( ;_; )<br> > ^ <",
        angry: "/\\_/\\<br>( >_< )<br> > ^ <"
    };

    // ROAMING PHYSICS
    function roam() {
        if (state.isPaused || state.isSleeping) return requestAnimationFrame(roam);

        petX += speed * direction;

        if (petX >= window.innerWidth - 80) {
            direction = -1;
            petFace.style.transform = 'scaleX(-1)'; // Flips only the face, not the menu
        } else if (petX <= 0) {
            direction = 1;
            petFace.style.transform = 'scaleX(1)';
        }

        pet.style.left = petX + 'px';
        requestAnimationFrame(roam);
    }

    roam(); // Start walking

    // THE METABOLISM (Stats change every 15 seconds)
    setInterval(() => {
        if (state.isSleeping) return; // Stats pause while sleeping

        if (state.hunger < 10) state.hunger++;
        if (state.happiness > 0) state.happiness--;

        updatePetStatus();
    }, 15000);

    // UPDATE UI & FACES
    function updatePetStatus() {
        // Text
        if (state.hunger > 7) hungerText.textContent = "Starving";
        else if (state.hunger > 4) hungerText.textContent = "Hungry";
        else hungerText.textContent = "Full";

        if (state.happiness > 7) moodText.textContent = "Happy";
        else if (state.happiness > 4) moodText.textContent = "Okay";
        else moodText.textContent = "Sad";

        // Face Logic
        if (state.isSleeping) {
            petFace.innerHTML = faces.sleeping;
        } else if (state.hunger > 7) {
            petFace.innerHTML = faces.angry;
        } else if (state.happiness < 4) {
            petFace.innerHTML = faces.sad;
        } else {
            petFace.innerHTML = faces.normal;
        }

        // Color warnings (Turns red if needs attention)
        hungerText.style.color = state.hunger > 7 ? '#ff3333' : 'var(--text-muted)';
        moodText.style.color = state.happiness < 4 ? '#ff3333' : 'var(--accent-acid)';
    }

    // Toggle Menu
    window.togglePetMenu = function () {
        if (state.isSleeping) {
            wakePet();
            return;
        }
        petMenu.classList.toggle('active');
        state.isPaused = petMenu.classList.contains('active');
    };

    function showDialogue(text, time = 2000) {
        petDialogue.textContent = text;
        petDialogue.style.opacity = '1';
        setTimeout(() => { petDialogue.style.opacity = '0'; }, time);
    }

    // Feed Button
    window.feedPet = function () {
        if (state.hunger === 0) {
            showDialogue("I'm already full! 🐾");
            return;
        }
        state.hunger = Math.max(0, state.hunger - 5);
        petFace.innerHTML = faces.eating;
        showDialogue("Nom nom... 🍙", 3000);

        setTimeout(() => { updatePetStatus(); }, 3000);
    };

    // Play Button
    window.playPet = function () {
        state.happiness = Math.min(10, state.happiness + 4);
        state.hunger = Math.min(10, state.hunger + 1); // Playing makes it slightly hungry

        petFace.innerHTML = faces.happy;
        showDialogue("Purrr! 🧶", 2000);

        // Little jump animation
        petFace.style.transform = `translateY(-15px) ${direction === -1 ? 'scaleX(-1)' : 'scaleX(1)'}`;
        setTimeout(() => {
            petFace.style.transform = `translateY(0) ${direction === -1 ? 'scaleX(-1)' : 'scaleX(1)'}`;
            updatePetStatus();
        }, 300);
    };

    // Sleep Button
    window.sleepPet = function () {
        state.isSleeping = true;
        petMenu.classList.remove('active');
        state.isPaused = true;
        petFace.innerHTML = faces.sleeping;
        showDialogue("Zzz...", 5000);

        // Regenerate stats over time while sleeping
        state.happiness = 10;
        state.hunger = 0;
    };

    // Wake up by clicking when asleep
    function wakePet() {
        state.isSleeping = false;
        state.isPaused = false;
        petFace.innerHTML = faces.happy;
        showDialogue("Good morning! ☀️");
        updatePetStatus();
    }

    // Initialize
    updatePetStatus();
}