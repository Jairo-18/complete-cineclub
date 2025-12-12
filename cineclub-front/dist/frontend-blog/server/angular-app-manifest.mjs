
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/home",
    "route": "/"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-XSMJIUHY.js",
      "chunk-TEZDPLRE.js",
      "chunk-QLWIP4YL.js",
      "chunk-ELQ4CZ6G.js",
      "chunk-PVDG46DZ.js",
      "chunk-NBVXWU6R.js",
      "chunk-UPJF4CXL.js",
      "chunk-VN3CQEPZ.js",
      "chunk-LYMOFPMC.js"
    ],
    "route": "/home"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-2LBQEIND.js"
    ],
    "route": "/auth"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-2LBQEIND.js",
      "chunk-UYXSU7XI.js",
      "chunk-VN3CQEPZ.js",
      "chunk-LYMOFPMC.js",
      "chunk-T3ANTPHN.js"
    ],
    "route": "/auth/login"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-2LBQEIND.js",
      "chunk-4V6ZFSNF.js",
      "chunk-NJIOGT5G.js",
      "chunk-UPJF4CXL.js",
      "chunk-VN3CQEPZ.js",
      "chunk-LYMOFPMC.js",
      "chunk-T3ANTPHN.js"
    ],
    "route": "/auth/register"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-2LBQEIND.js",
      "chunk-JKQKKBMP.js",
      "chunk-VN3CQEPZ.js",
      "chunk-LYMOFPMC.js",
      "chunk-T3ANTPHN.js"
    ],
    "route": "/auth/recover-password"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-2LBQEIND.js",
      "chunk-IFHZHTOW.js",
      "chunk-VN3CQEPZ.js",
      "chunk-LYMOFPMC.js",
      "chunk-T3ANTPHN.js"
    ],
    "route": "/auth/set-password"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-2LBQEIND.js"
    ],
    "route": "/auth/callback"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-2LBQEIND.js",
      "chunk-QUF6OO6E.js",
      "chunk-T3ANTPHN.js"
    ],
    "route": "/auth/send-email"
  },
  {
    "renderMode": 2,
    "route": "/profile"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-YVSL5RF2.js",
      "chunk-2J5TO5HG.js",
      "chunk-QXROUS5G.js",
      "chunk-C53J335E.js",
      "chunk-TEZDPLRE.js",
      "chunk-QLWIP4YL.js",
      "chunk-ELQ4CZ6G.js",
      "chunk-PVDG46DZ.js",
      "chunk-NBVXWU6R.js",
      "chunk-UPJF4CXL.js"
    ],
    "route": "/profile/user-profile"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-YVSL5RF2.js",
      "chunk-HCFDE3RA.js",
      "chunk-C53J335E.js",
      "chunk-NJIOGT5G.js",
      "chunk-UPJF4CXL.js",
      "chunk-LYMOFPMC.js",
      "chunk-T3ANTPHN.js"
    ],
    "route": "/profile/register-profile"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-YVSL5RF2.js",
      "chunk-BP5OZTBV.js",
      "chunk-NBVXWU6R.js",
      "chunk-VN3CQEPZ.js",
      "chunk-LYMOFPMC.js"
    ],
    "route": "/profile/my-friends"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-YVSL5RF2.js",
      "chunk-QRABS5DV.js",
      "chunk-ELQ4CZ6G.js",
      "chunk-NBVXWU6R.js",
      "chunk-VN3CQEPZ.js",
      "chunk-LYMOFPMC.js"
    ],
    "route": "/profile/public-profile/*"
  },
  {
    "renderMode": 2,
    "route": "/organizational"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-X6WTEVYI.js",
      "chunk-NPLINP34.js",
      "chunk-UU4455WY.js",
      "chunk-PVDG46DZ.js",
      "chunk-NBVXWU6R.js",
      "chunk-NJIOGT5G.js",
      "chunk-UPJF4CXL.js",
      "chunk-VN3CQEPZ.js",
      "chunk-LYMOFPMC.js"
    ],
    "route": "/organizational/see-users"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-X6WTEVYI.js",
      "chunk-7CBWOAPF.js",
      "chunk-UU4455WY.js",
      "chunk-NJIOGT5G.js",
      "chunk-UPJF4CXL.js",
      "chunk-VN3CQEPZ.js",
      "chunk-LYMOFPMC.js"
    ],
    "route": "/organizational/edit-user/*"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-L4OINLDS.js",
      "chunk-QXROUS5G.js",
      "chunk-QLWIP4YL.js",
      "chunk-VN3CQEPZ.js",
      "chunk-LYMOFPMC.js"
    ],
    "route": "/movies"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-L4OINLDS.js",
      "chunk-QXROUS5G.js",
      "chunk-QLWIP4YL.js",
      "chunk-VN3CQEPZ.js",
      "chunk-LYMOFPMC.js"
    ],
    "route": "/movies/library"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-L4OINLDS.js",
      "chunk-QXROUS5G.js",
      "chunk-QLWIP4YL.js",
      "chunk-VN3CQEPZ.js",
      "chunk-LYMOFPMC.js",
      "chunk-PLYITVO2.js"
    ],
    "route": "/movies/top"
  },
  {
    "renderMode": 2,
    "redirectTo": "/home",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 63131, hash: 'd8b58db45d3225100e03c61ea31e5dbcf9d4d3782c9a409eee881027cd108785', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17656, hash: 'cd6131c67cf1ce587c31f8cc200598c164495aaa1724f181fe3dee1a7a1af48a', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'auth/index.html': {size: 121674, hash: '2484625c75a8da38dfa92ea89230fd1263fe616f3f24d5b396a83ae75845e678', text: () => import('./assets-chunks/auth_index_html.mjs').then(m => m.default)},
    'auth/callback/index.html': {size: 129013, hash: '651b4b4b582de49bd5caafb3fa1dc0ee8548f4bd5d723f9c036a037bf2d53d6c', text: () => import('./assets-chunks/auth_callback_index_html.mjs').then(m => m.default)},
    'auth/set-password/index.html': {size: 170288, hash: 'c9569ffae31d10190d7f48299cce0b0f5e173378c3f29deca5c88ae0e0a3f921', text: () => import('./assets-chunks/auth_set-password_index_html.mjs').then(m => m.default)},
    'home/index.html': {size: 133062, hash: '25979f429d6c620a42b8de0039f4a5948275a0d0f20ee394b505cbf9cfd8d1e3', text: () => import('./assets-chunks/home_index_html.mjs').then(m => m.default)},
    'profile/register-profile/index.html': {size: 166931, hash: 'f62f1808074f50d1490603808c1540597d197ed2559c131ceef00e2e7d9a14e4', text: () => import('./assets-chunks/profile_register-profile_index_html.mjs').then(m => m.default)},
    'organizational/index.html': {size: 166566, hash: 'fe641d82ab99264253632eca520a2ba6e0578b3be1fe592aeb644829129d12c6', text: () => import('./assets-chunks/organizational_index_html.mjs').then(m => m.default)},
    'movies/index.html': {size: 166827, hash: '977472fda745429039a83aefe26ed1c9a296e5d6fbac8cadd2bb3cc70a6b44ff', text: () => import('./assets-chunks/movies_index_html.mjs').then(m => m.default)},
    'movies/top/index.html': {size: 166879, hash: '06f81df7a6f126ad29db21e8245921761f4fc381e10730f5b431508a3546f44b', text: () => import('./assets-chunks/movies_top_index_html.mjs').then(m => m.default)},
    'auth/send-email/index.html': {size: 124000, hash: '036bc048c77ee69740c676e6510eaedd57ccdcde17c3bd567693ee0ce7220ff8', text: () => import('./assets-chunks/auth_send-email_index_html.mjs').then(m => m.default)},
    'profile/user-profile/index.html': {size: 167087, hash: 'b9cb753dcaf2ceb63aa1fdc6ef86b415fc384a00de180ff5b3ae83f9b790e409', text: () => import('./assets-chunks/profile_user-profile_index_html.mjs').then(m => m.default)},
    'organizational/see-users/index.html': {size: 167035, hash: '8d7c349f8a60f5e76a90f2c873357c7cdae7896a794e101ee4ac1fa90a6128c2', text: () => import('./assets-chunks/organizational_see-users_index_html.mjs').then(m => m.default)},
    'auth/login/index.html': {size: 166827, hash: '37ce9d28fe8f8c2294e0c1bf20fae9087bdd744b22faa5441ba4cdcbf6ccae9d', text: () => import('./assets-chunks/auth_login_index_html.mjs').then(m => m.default)},
    'movies/library/index.html': {size: 166827, hash: '977472fda745429039a83aefe26ed1c9a296e5d6fbac8cadd2bb3cc70a6b44ff', text: () => import('./assets-chunks/movies_library_index_html.mjs').then(m => m.default)},
    'profile/index.html': {size: 166566, hash: 'cd97ba5c934a7b4cfc9d93eeacd128414352b243df62a61727fd78d255af9778', text: () => import('./assets-chunks/profile_index_html.mjs').then(m => m.default)},
    'auth/register/index.html': {size: 193262, hash: '33d7132caf403249de54b5eb322d59efb86ec35e181475d2d9e368db3e270ada', text: () => import('./assets-chunks/auth_register_index_html.mjs').then(m => m.default)},
    'profile/my-friends/index.html': {size: 166827, hash: '5456c19a5bc33bdd5676541eff4fc1bb74282fe126df29276eedc97256aef0c8', text: () => import('./assets-chunks/profile_my-friends_index_html.mjs').then(m => m.default)},
    'auth/recover-password/index.html': {size: 162247, hash: '247ccf7a36e2ababdd7d1db6531c54d2b54fb6495e504e6fc148caba907b594d', text: () => import('./assets-chunks/auth_recover-password_index_html.mjs').then(m => m.default)},
    'styles-GS6V4YAH.css': {size: 211675, hash: 'SQmcuL4Xe44', text: () => import('./assets-chunks/styles-GS6V4YAH_css.mjs').then(m => m.default)}
  },
};
