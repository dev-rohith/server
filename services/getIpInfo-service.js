import axios from "axios";

export async function getIpInfo(ip) {
  const accessKey = process.env.APIIP_ACCESS_KEY;
  const apiUrl = `https://apiip.net/api/check?ip=${ip}&accessKey=${accessKey}`;
  const response = await axios.get(apiUrl);
  const result = response.data;
  return result;
}
