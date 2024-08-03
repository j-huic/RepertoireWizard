console.log("fetch.js running");

async function fenfetch(FEN, rep = 139388) {
  console.log("fetch function called");
  if (!FEN) FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const path = fentopath(FEN, rep);
  //let proxyUrl = 'https://cors-anywhere.herokuapp.com/';

  try {
    const response = await fetch("https://www.chessable.com" + path, {
      method: "GET",
      headers: {
        authority: "www.chessable.com",
        method: "GET",
        path: path,
        scheme: "https",
        Accept: "*/*",
        "Accept-encoding": "gzip, deflate, br, zstd",
        "Accept-language": "en",
        Cookie:
          "osano_consentmanager_uuid=fe360877-ed71-46ac-bbd6-6356784a8b1e; __stripe_mid=024f7f64-7dcd-480f-8b96-de44679f47e1aaaa14; stonlyWidget_autolaunchTriggered_10064=1; amp_1cf00e=OS5HhuH1jMALs8_Q8ofeHz.NDA5ODcz..1gsif54ja.1gsih27sd.15e.35.18j; experimentDeviceId=66f55a02-a927-4b69-81f6-e96d4324a456; uidsessid=409873; unamesessid=420noscope; loginstringsessid=603aae081fb3cf6e%3A81f62cbdc5c100801a759056a8924988; _gcl_au=1.1.998311491.1709581378; _gid=GA1.2.1771934495.1709581379; _fbp=fb.1.1709581378660.873220012; tms_VisitorID=cgufscm2gx; _ga=GA1.2.1394623788.1642888875; _ga_Z6ZD3CB4HN=GS1.2.1709847828.15.0.1709847828.60.0.0; _ga_SM6G6M7B8T=GS1.1.1709849947.18.0.1709849947.0.0.0; sec_session_id=2c8e7fa69608ff60b5ce667d7e15c195; amp_dfb317=iDb-VHzh9idDiayvKHFz6V.NDA5ODcz..1hodfvcdt.1hodhbetu.1hl.4g.1m5",
        Referer: "https://www.chessable.com/mt1/explore/",
        "Sec-Ch-Ua":
          'Not A(Brand);v="99", "Google Chrome";v="121", "Chromium";v="121"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Fetch-Platform": "Windows",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
  //   .then((response) => response.json())
  //   .then((data) => {
  //     console.log(data);
  //     callback(data);
  //   })
  //   .catch((error) => console.error("Error:", error));
}

fentopath = function (FEN, rep) {
  return (
    "/ajax/nextMoves.php?next=" + FEN.replace(/\s/g, "%20") + "&rep=" + rep
  );
};

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  console.log("listener listening");
  if (request.method === "fetch") {
    console.log("content script received fetch message");
    try {
      console.log("trying to fetch");
      const data = await fenfetch(request.fen);
      sendResponse(data);
    } catch (error) {
      console.error("Error:", error);
      sendResponse(null);
    }

    return true;
  }
});
