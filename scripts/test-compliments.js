// Test script to simulate sending compliments to children
// Run this in the browser console to test the compliment notification system

// Function to send a compliment to a child
function sendTestCompliment(childId, complimentCard) {
  const complimentData = {
    id: Date.now().toString(),
    from: 'Test Ouder',
    card: complimentCard,
    receivedAt: new Date().toISOString(),
    read: false
  };

  // Get existing compliments for this child
  const existingCompliments = JSON.parse(
    localStorage.getItem(`child_compliments_${childId}`) || '[]'
  );

  // Add new compliment
  existingCompliments.unshift(complimentData);

  // Store back in localStorage (keep only last 10 compliments)
  localStorage.setItem(
    `child_compliments_${childId}`,
    JSON.stringify(existingCompliments.slice(0, 10))
  );

  console.log('Compliment sent to child:', childId, complimentData);
  return complimentData;
}

// Example compliment cards
const testCards = [
  {
    id: 'super-hero',
    title: 'Superheld!',
    message: 'Je bent mijn superheld! Dankjewel voor je hulp!',
    emoji: '🦸‍♂️',
    color: 'from-red-400 to-orange-500',
    category: 'helpfulness'
  },
  {
    id: 'star-performer',
    title: 'Sterren Prestatie!',
    message: 'Wat een sterrenprestatie! Ik ben zo trots op je!',
    emoji: '⭐',
    color: 'from-yellow-400 to-orange-500',
    category: 'achievement'
  }
];

// Usage examples:
// sendTestCompliment('0714c192-cd2c-4b6e-a9b1-eb43bbda7fae', testCards[0]); // Send super hero compliment
// sendTestCompliment('0714c192-cd2c-4b6e-a9b1-eb43bbda7fae', testCards[1]); // Send star performer compliment

console.log('Compliment test functions loaded!');
console.log('Available test cards:', testCards);
console.log('Use: sendTestCompliment(childId, testCards[index]) to send a compliment');