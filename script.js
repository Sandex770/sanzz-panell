const global = {
  domain: "https://mikudevprivate.pteropanelku.biz.id",
  apikey: "ptla_7gss1IvRmWISvixYyZ4fEQgPD6wLvakmAeZMyoT9HFQ",
  nestid: "5",
  egg: "15",
  loc: "1",
  qrisOrderKuota: "00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214520146378043870303UMI51440014ID.CO.QRIS.WWW0215ID20243618270230303UMI5204541153033605802ID5919STOK RESS OK21423066007CILEGON61054241162070703A016304F736",
  apiSimpelBot: "new2025",
  apikeyorkut: "https://simpelz.fahriofficial.my.id",
  merchantIdOrderKuota: "OK2142306",
  apiOrderKuota: "700336617360840832142306OKCT7A1A4292BE20CEF492B467C5B6EAC103",
};

let timeout, interval;

function toIDR(value) {
  return Number(value).toLocaleString("id-ID");
}

function getRandomFee(min = 100, max = 500) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function buatPembayaran() {
  const pilihan = document.getElementById("pilihRam").value;
  const username = document.getElementById("username").value;
  if (!pilihan || !username) return alert("Harap isi username dan pilih RAM!");

  const Obj = getSpecByCmd(pilihan);
  if (!Obj) return alert("Pilihan RAM tidak valid!");

  const fee = getRandomFee();
  const amount = parseInt(Obj.harga) + fee;

  try {
    const res = await fetch(
      `${global.apikeyorkut}/api/orkut/createpayment?apikey=${global.apiSimpelBot}&amount=${amount}&codeqr=${global.qrisOrderKuota}`
    );
    const data = await res.json();
    const result = data.result;
    if (!result || !result.transactionId) throw new Error("Gagal membuat QRIS");

    document.getElementById("infoPembayaran").classList.remove("hidden");
    document.getElementById("qrImage").src = result.qrImageUrl;

    document.getElementById("detailPembayaran").textContent = `乂 INFORMASI PEMBAYARAN

• ID : ${result.transactionId}
• Username : ${username}
• RAM : ${pilihan}
• Expired : 5 menit

• Harga Asli : Rp${toIDR(Obj.harga)}
• Biaya Admin : Rp${toIDR(fee)}
• Total Pembayaran : Rp${toIDR(result.amount)}

Note : QRIS hanya berlaku selama 5 menit.`;

    clearTimeout(timeout);
    clearInterval(interval);

    timeout = setTimeout(() => {
      alert("QRIS Pembayaran telah expired!");
      document.getElementById("infoPembayaran").classList.add("hidden");
    }, 5 * 60 * 1000);

    interval = setInterval(async () => {
      const cek = await fetch(
        `${global.apikeyorkut}/api/orkut/cekstatus?apikey=${global.apiSimpelBot}&merchant=${global.merchantIdOrderKuota}&keyorkut=${global.apiOrderKuota}`
      );
      const json = await cek.json();

      if (parseInt(json?.amount) === result.amount) {
        clearInterval(interval);
        clearTimeout(timeout);
        await buatAkunDanServer(username, Obj);
      }
    }, 8000);
  } catch (error) {
    console.error(error);
    alert("Terjadi kesalahan saat memproses pembayaran.");
  }
}

function getSpecByCmd(cmd) {
  const specs = {
    "1gb": { ram: "1000", disk: "1000", cpu: "40", harga: "10" },
    "2gb": { ram: "2000", disk: "1000", cpu: "60", harga: "20" },
    "3gb": { ram: "3000", disk: "2000", cpu: "80", harga: "30" }, // sudah diperbaiki
    "4gb": { ram: "4000", disk: "2000", cpu: "100", harga: "40" },
    "5gb": { ram: "5000", disk: "3000", cpu: "120", harga: "50" },
    "6gb": { ram: "6000", disk: "3000", cpu: "140", harga: "60" },
    "7gb": { ram: "7000", disk: "4000", cpu: "160", harga: "70" },
    "8gb": { ram: "8000", disk: "4000", cpu: "180", harga: "80" },
    "9gb": { ram: "9000", disk: "5000", cpu: "200", harga: "90" },
    "10gb": { ram: "10000", disk: "5000", cpu: "220", harga: "100" },
    "unli": { ram: "0", disk: "0", cpu: "0", harga: "150" },
    "unlimited": { ram: "0", disk: "0", cpu: "0", harga: "150" }
  };
  return specs[cmd];
}

async function buatAkunDanServer(username, Obj) {
  const email = `${username}@gmail.com`;
  const name = `${username.charAt(0).toUpperCase() + username.slice(1)} Server`;
  const password = `${username}${Math.floor(Math.random() * 1000)}`;

  try {
    const buatUser = await fetch("/api/proxy?route=users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${global.apikey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        email,
        username: username.toLowerCase(),
        first_name: name,
        last_name: "Server",
        language: "en",
        password
      })
    });

    const user = await buatUser.json();
    if (user.errors) return alert("Gagal buat akun panel:\n" + JSON.stringify(user.errors[0] || user));

    const userId = user.attributes.id;

    const eggInfo = await fetch(`${global.domain}/api/application/nests/${global.nestid}/eggs/${global.egg}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${global.apikey}`
      }
    });

    const egg = await eggInfo.json();
    const startup_cmd = egg.attributes.startup;

    const buatServer = await fetch("/api/proxy?route=servers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${global.apikey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        name,
        user: userId,
        egg: parseInt(global.egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
        startup: startup_cmd,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start"
        },
        limits: {
          memory: Obj.ram,
          swap: 0,
          disk: Obj.disk,
          io: 500,
          cpu: Obj.cpu
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 5
        },
        deploy: {
          locations: [parseInt(global.loc)],
          dedicated_ip: false,
          port_range: []
        },
        description: "Dibuat otomatis"
      })
    });

    const server = await buatServer.json();
    if (server.errors) return alert("Gagal buat server panel:\n" + JSON.stringify(server.errors[0] || server));

    const output = `
Berhasil Membuat Akun Panel ✅

• ID Server: ${server.attributes.id}
• Nama: ${name}
• Username: ${user.attributes.username}
• Password: ${password}
• Login: ${global.domain}
• Ram: ${Obj.ram == "0" ? "Unlimited" : Obj.ram / 1000 + "GB"}
• Cpu: ${Obj.cpu == "0" ? "Unlimited" : Obj.cpu + "%"}
• Disk: ${Obj.disk == "0" ? "Unlimited" : Obj.disk / 1000 + "GB"}
• Expired: 1 Bulan

Harap simpan data ini baik-baik.
    `;

    alert(output);
    document.getElementById("infoPembayaran").classList.add("hidden");
  } catch (err) {
    console.error(err);
    alert("Gagal saat membuat akun/server. Cek konsol untuk detail.");
  }
}