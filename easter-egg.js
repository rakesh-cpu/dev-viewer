/**
 * Easter Egg: The Blushing Meme Button
 * 
 * Interaction Logic:
 * - Hovers 1-4: Progressive emojis (Blush -> Happy -> etc.)
 * - Hover 5: "Stop" emoji + Shake effect.
 * - Clicks 1-4: Progressive emojis.
 * - Click 5: "Stop" emoji + Shake.
 * - Create condition: After 5 Hovers AND 5 Clicks -> Unlock Meme Modal.
 */

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('easterEggBtn');
    const icon = document.getElementById('easterEggIcon');
    const modal = document.getElementById('memeModal');
    const closeBtn = document.getElementById('closeMemeModal');
    const memeImg = document.getElementById('memeImage');
    
    if (!btn || !modal) return;

    let hoverCount = 0;
    let clickCount = 0;

    // Progression Emojis (User can replace these)
    const hoverEmojis = ["☺️", "🤭", "🫣", "🫠"]; 
    const clickEmojis = ["👆", "👊", "🖐️", "✋"];
    const stopEmoji = "🛑";

    // Meme Collection
    const memes = [
        "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWlweWhmMWRuZHY4M25jbjJoN3cycG9kbThtaXRrcXBnN2tjY2M0MCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/8HBRAVPws2AYDNa2Gz/giphy.gif",
        "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXA0OWxxbW52eDVpYWRqN2JhODgxaXlwamVsOXBtbXpjdnFoYjZwaiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ytu2GUYbvhz7zShGwS/giphy.gif",
        "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3cmN4YzV1dWZzdmFkbzg2bHp0OXF4b21hdm5ocmE5ejBxZmVreXlmMSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/V1VoaSnMhwKMxXPqwn/giphy.gif", 
        "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHg4Y2MwMWl2cXQxN2U5Z2Rmc2NjODJjcXQ3NHM0dXJwdjJtcnZmeiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1lyR0Zg2ovXwFIzshu/giphy.gif", 
        "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif"
    ];

    // Helper to show temporary emoji
    const showFeedback = (emoji, isShake = false) => {
        // Swap to Emoji
        const wasMaterial = icon.classList.contains('material-symbols-rounded');
        if (wasMaterial) {
            icon.classList.remove('material-symbols-rounded');
            icon.style.fontFamily = '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
        }
        
        icon.textContent = emoji;
        if (!isShake) btn.classList.add('blushing');
        if (isShake) btn.classList.add('shake');

        setTimeout(() => {
            btn.classList.remove('blushing');
            btn.classList.remove('shake');
            
            // Restore Material Icon (Default state)
            if (wasMaterial) {
                icon.style.fontFamily = '';
                icon.classList.add('material-symbols-rounded');
            }
            icon.textContent = 'sentiment_satisfied';
        }, 600);
    };

    // Hover Interaction
    btn.addEventListener('mouseenter', () => {
        hoverCount++;
        
        if (hoverCount <= 4) {
            // Show progressive emoji
            const emoji = hoverEmojis[hoverCount - 1] || hoverEmojis[0];
            showFeedback(emoji);
        } else if (hoverCount === 5) {
            // Show Stop + Shake
            showFeedback(stopEmoji, true);
        } else {
            // Keep shaking on subsequent hovers
            btn.classList.add('shake');
            setTimeout(() => btn.classList.remove('shake'), 500);
        }
    });

    // Click Interaction
    // Supports mouse click and touch (touchend fires click usually suitable for buttons)
    btn.addEventListener('click', () => {
        clickCount++;

        // Visual Feedback for Clicks
        if (clickCount <= 4) {
             const emoji = clickEmojis[clickCount - 1] || clickEmojis[0];
             showFeedback(emoji);
        } else if (clickCount === 5) {
             showFeedback(stopEmoji, true);
        }

        // Unlock Condition: > 5 Hovers AND > 5 Clicks (Triggers on 6th interaction+)
        if (hoverCount >= 5 && clickCount >= 5) {
             // Slight delay to let the feedback finish? Or immediate?
             // Triggers immediately to reward persistence
             setTimeout(() => {
                 showMeme();
                 // Reset counts
                 hoverCount = 0;
                 clickCount = 0;
             }, 300);
        }
    });

    function showMeme() {
        const randomMeme = memes[Math.floor(Math.random() * memes.length)];
        if (memeImg) {
            memeImg.src = randomMeme;
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
    }

    // Modal Closing
    const closeAction = () => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        if (memeImg) memeImg.src = ''; 
    };

    if (closeBtn) closeBtn.addEventListener('click', closeAction);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAction();
    });
});
