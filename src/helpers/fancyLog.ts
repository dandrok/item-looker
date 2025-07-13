export function loadingDots(message: string) {
  let dots = "";
  const interval = setInterval(() => {
    dots = dots.length >= 3 ? "" : dots + ".";
    process.stdout.write(`\r${message}${dots}   `);
  }, 500);

  return () => {
    clearInterval(interval);
    process.stdout.write(`\r${message}... done!\n`);
  };
}
