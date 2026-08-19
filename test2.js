async function run() {
  const url = 'https://script.google.com/macros/s/AKfycbwz2ukzowfSJIDgywqTz4dZa_qNd1kmXKX1a380l8YIb_HnciGNkT5OaZFyoaRVb--c/exec';
  try {
    const res = await fetch(url);
    console.log("GET res ok:", res.ok);
    const text = await res.text();
    console.log("GET text:", text.substring(0, 100));
  } catch (err) {
    console.error("GET error:", err);
  }
}
run();
