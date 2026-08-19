async function run() {
  const url = 'https://script.google.com/macros/s/AKfycbwz2ukzowfSJIDgywqTz4dZa_qNd1kmXKX1a380l8YIb_HnciGNkT5OaZFyoaRVb--c/exec';
  const snapshot = {
    users: [], orders: [], deletedOrders: [], categories: [], factories: [], factoryBills: [], expenses: []
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(snapshot),
      redirect: 'follow'
    });
    console.log("POST res ok:", res.ok);
    const text = await res.text();
    console.log("POST text:", text.substring(0, 100));
  } catch (err) {
    console.error("POST error:", err);
  }
}

run();
