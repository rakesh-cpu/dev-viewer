/**
 * Easter Egg: The Blushing Meme Button
 * 
 * Interaction Logic:
 * - Hovers 1-5: Progressive emojis (Blush -> Happy -> etc.)
 * - Hovers > 5: "Run Away" mode (Random jumps to avoid capture).
 * - Clicks 1-4: Progressive emojis.
 * - Click 5: Unlock Meme Modal.
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

    // Progression Emojis
    const hoverEmojis = ["☺️", "🤭", "🫣", "🫠", "😵‍💫"]; 
    const clickEmojis = ["👆", "👊", "🖐️", "✋", "🎉"];
    const catchMeEmoji = "🏃";

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
            
            // Should we revert to default icon? 
            // Only if NOT running away (we want to keep the runner emoji if running)
            if (hoverCount <= 5) {
                if (wasMaterial) {
                    icon.style.fontFamily = '';
                    icon.classList.add('material-symbols-rounded');
                }
                icon.textContent = 'sentiment_satisfied';
            }
        }, 600);
    };

    // Run Away Logic
    const runAway = () => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const btnRect = btn.getBoundingClientRect();
        
        // Ensure the button stays somewhat within the viewport but moves significantly
        // Margin to keep it away from edges
        const margin = 50; 
        
        const maxLeft = viewportWidth - btnRect.width - margin;
        const maxTop = viewportHeight - btnRect.height - margin;
        
        const newLeft = margin + Math.random() * (maxLeft - margin);
        const newTop = margin + Math.random() * (maxTop - margin);
        
        btn.style.position = 'fixed';
        btn.style.left = `${newLeft}px`;
        btn.style.top = `${newTop}px`;
        btn.style.bottom = 'auto';
        btn.style.right = 'auto';
        
        // Show runner emoji
        showFeedback(catchMeEmoji, false);
    };

    // Hover Interaction
    btn.addEventListener('mouseenter', () => {
        hoverCount++;
        
        if (hoverCount <= 5) {
            // Show progressive emoji
            const emoji = hoverEmojis[hoverCount - 1] || hoverEmojis[0];
            showFeedback(emoji);
        } else {
            // Run Away!
            runAway();
        }
    });

    // Click Interaction
    btn.addEventListener('click', () => {
        clickCount++;

        // Visual Feedback for Clicks
        if (clickCount < 5) {
             const emoji = clickEmojis[clickCount - 1] || clickEmojis[0];
             showFeedback(emoji);
        } else if (clickCount === 5) {
             // Unlock Meme Modal
             showMeme();
             // Reset counts optional? Let's keep them enjoying the memes.
             // clickCount = 0; 
        } else {
            // > 5 clicks, just show another meme
             showMeme();
        }
    });

    function showMeme() {
        const randomMeme = memes[Math.floor(Math.random() * memes.length)];
        if (memeImg) {
            memeImg.src = randomMeme;
            
            // Random rotate title
            const title = modal.querySelector('h2');
            if(title) {
                const titles = ["YOU FOUND IT!", "SECRETS UNLOCKED!", "MEME TIME!", "CODING BREAK!"];
                title.textContent = titles[Math.floor(Math.random() * titles.length)];
            }
            
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
