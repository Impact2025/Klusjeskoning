async function main() {
  const response = await fetch('http://localhost:3001/api/app', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'registerFamily',
      payload: {
        familyName: 'Testgezin',
        city: 'Utrecht',
        email: 'testgezin@example.com',
        password: 'Password123!',
      },
    }),
  });

  const text = await response.text();
  console.log(response.status, text);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
