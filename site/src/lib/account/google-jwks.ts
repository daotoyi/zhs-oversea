import type { JSONWebKeySet } from 'jose';

// Google 公开签名密钥（OIDC id_token 验签用）。来源：https://www.googleapis.com/oauth2/v3/certs
// 国内服务器无法直连 Google，故不再由服务器换 token，改为「前端中继 id_token + 本地验签」。
// 此快照需定期（数月）更新：重新下载上述地址替换 keys 即可（Google 轮换时会保留旧 kid 一段时间）。
export const GOOGLE_JWKS: JSONWebKeySet = {
  keys: [
    {
      kty: 'RSA',
      use: 'sig',
      kid: '943a3a5d7d919625a454e489b75c29adab57acba',
      alg: 'RS256',
      n: 'pIpnzA2ezyEERJSxiqpLBmMeIqATH-V6iuBtKIibXEyYovujrx8niqTeO6RIyXT6uDUUv0V2kJ8V_iWYFxzXY1BqK9IfcAmjg0XUDoyTVkoyLsF0gj299LH-zw5vCvy8jmamFIZKAbKcQ5hpHvSittM1vl-6vVL-i2GxyGbMA9aY6Hq15NylS1t7ELTYfQimlnvxcb7_DM0cuS5U1SfbCZMCpKhh0nrSlYds240oxpCJOV2rBahs_Ea5c7tezS1nwVC9W_E-bR9TF6BHkC_fv-E8DcWfkI_6geaJzBhINNxBfjx-w1-WUp2Jz3YYFWEfeQjxMqu-Fg6cGxwk7V16uQ',
      e: 'AQAB',
    },
    {
      kty: 'RSA',
      use: 'sig',
      kid: 'f10f87405a979c1df36df26606734f33cd85c271',
      alg: 'RS256',
      n: '4rY5uwZK1dQ-UVgB5s4NLyC-u5LC2MT7b8GWZztiNgMsp0Nnqx0pM7Ofx0ws32N2aZcx10-J8ydQxnNb9uAcf-7LyhyOIcv_WEyzaSbUAMOgoF-nQmJetckxNg6ekhNfaFcTQS0T-29ql2_CBLIML6CvSh-r0fgWRsqN2ayB7wCl74Gv6OOVbvagUWhj5z2L6o_plmsPDwLVuvA7o3WDEDjoq-IXafRQowj92kQUenrOKD4YCopuLIBhel6VH8doFRNZ6KISQhMcOivWaLU_UtKKAMloGJieTf_3r-_nErs2h5wB7T7FrMCScmO7mvFQXKh8_4P-MlbfgS9CUvQksw',
      e: 'AQAB',
    },
  ],
};
