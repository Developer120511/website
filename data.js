/* =========================================================
   TitanDrive — datos del catálogo
   Fuente única de verdad para index.html y repositorio.html
   ========================================================= */

const SITE_META = {
    name: 'TitanDrive',
    updated: 'Agosto 2026',
};

const FEATURED = {
    name: 'KMSoffline v2.3.5',
    code: 'TD-000',
    description: 'Herramienta de activación independiente',
    url: 'https://drive.google.com/file/d/1GxYTBrXKo05zGK5z2GtfFFi5Z5OBat45/view?usp=sharing',
};

const FOLDERS = [
    {
        name: 'Productividad y Lectura',
        icon: '📚',
        items: [
            { name: 'Foxit Reader', url: 'https://drive.google.com/file/d/1shRuWU_DuF2GDVwQ0b1BbNj7ffKuR3zs/view?usp=drive_link' },
            { name: 'Microsoft Office 2019 Pro Plus', url: 'https://drive.google.com/file/d/1kA_GHXGrNYeJQ7jtqowWyBoy8oaQSzC-/view?usp=drive_link' },
            { name: 'SuperCopier 5', url: 'https://drive.google.com/file/d/1-jsUoSshkiheHzznVOxDRPZxCWxsKGjr/view?usp=drive_link' }
        ]
    },
    {
        name: 'Antivirus',
        icon: '🛡️',
        items: [
            { name: 'Segurmatica', url: 'https://drive.google.com/file/d/1a9Cm_DVn_nqkInrpOWGrOFLRFXhfVp7X/view?usp=drive_link' },
            { name: 'Kaspersky', url: 'https://drive.google.com/file/d/1dp57dSszDJ1DzGVYm8jnT6C7HnSV9x28/view?usp=drive_link' }
        ]
    },
    {
        name: 'Compresión',
        icon: '📦',
        items: [
            { name: 'WinRar', url: 'https://drive.google.com/file/d/11nthJKkDvSjL2YvzS15Zjo-yZtkefll6/view?usp=drive_link' },
            { name: '7-zip', url: 'https://drive.google.com/file/d/1fuArujAABuGUq-bFDbyj6y4RH1kGvE0k/view?usp=drive_link' }
        ]
    },
    {
        name: 'Desarrollo y Programación',
        icon: '💻',
        items: [
            { name: 'Godot_v4.5.1', url: 'https://drive.google.com/file/d/1HBy3n9nD7lFRvOd2n4GPEuFmn_D0oF_e/view?usp=drive_link' },
            { name: 'LM-Studio-0.4.14-4-x64', url: 'https://drive.google.com/file/d/14A2nlhxWDjgRqJxuhiIdJJxB1uh_4vtr/view?usp=drive_link' },
            { name: 'MstyStudio-x64', url: 'https://drive.google.com/file/d/1KP6qn8QjfeuoNVwn92npj_jNV-pia_Z_/view?usp=drive_link' },
            { name: 'VSCodeUserSetup-x64-1.105.0', url: 'https://drive.google.com/file/d/1mWtCbKiu7OTGO1zxbna5xryPs7VrBbZn/view?usp=drive_link' }
        ]
    },
    {
        name: 'Emuladores',
        icon: '🎮',
        items: [
            { name: 'MEmu-Setup-8.1.0', url: 'https://drive.google.com/file/d/1TE0haDBuJ0xlBjMokC3PsIjxVQnh-9v4/view?usp=drive_link' },
            { name: 'LDPlayer_9.5.11.1', url: 'https://drive.google.com/file/d/1swAvWn93DaMt4zuRAaH4-rG4XRKxMnKA/view?usp=sharing' }
        ]
    },
    {
        name: 'Frameworks y Runtimes',
        icon: '⚙️',
        items: [
            { name: 'Java', url: 'https://drive.google.com/drive/folders/1aS-e25lYxmUFEJhA61ZopT-4ptTbG7jP?usp=drive_link' },
            { name: 'Visual-C y Runtime', url: 'https://drive.google.com/drive/folders/1ElBwkWhyXbFjsn519Se5vsRK92ceuM_H?usp=drive_link' },
            { name: 'Anaconda3-2025.12-2-Windows-x86_64', url: 'https://drive.google.com/file/d/11UowbswT9Lm_gJ4WIYUt156rqkxtQYsm/view?usp=drive_link' },
            { name: 'Direct X', url: 'https://drive.google.com/file/d/1P9ij9SIz_rbD8bImaBFFIdn1Ap_3EJas/view?usp=drive_link' },
            { name: 'Net. Framework 4.8', url: 'https://drive.google.com/file/d/1FIa_8apAMibJadafrgv6B8-Gqh-_1r-9/view?usp=drive_link' },
            { name: 'Python-3.14.0-amd64', url: 'https://drive.google.com/file/d/1Js2yHo7Zt41ZLgYLfGAgaJJmiA9WNJsY/view?usp=drive_link' },
            { name: 'Xampp-8-2-12', url: 'https://drive.google.com/file/d/19-Mau3xgovXucXXH2y-3CFYo8qMkA8ks/view?usp=drive_link' }
        ]
    },
    {
        name: 'Modelos de IA',
        icon: '🤖',
        items: [
            { name: 'Deepseek-coder-1.3b-chat-and-function-calling.Q4_K_M', url: 'https://drive.google.com/file/d/1lyt0GTs1JwV9YQ5i_u_URp-QhbC0ZCm9/view?usp=drive_link' }
        ]
    },
    {
        name: 'Multimedia y Diseño',
        icon: '🎨',
        items: [
            { name: 'Blender-5-0-0', url: 'https://drive.google.com/file/d/1P-RPgWqQvqxO8PzPZ6Kl4ylngLeRXwrb/view?usp=drive_link' },
            { name: 'FSViewerSetup81', url: 'https://drive.google.com/file/d/1Zv9LxW0BLEJrkWHDADs6k8D31WwiOwnK/view?usp=drive_link' },
            { name: 'K-Lite_Codec_Pack_1452_Full', url: 'https://drive.google.com/file/d/1gwiyteQ8YKCoTF4B8xCWJQpwAAwBkGIc/view?usp=drive_link' },
            { name: 'OBS-Studio-32.0.1-Windows-x64-Installer', url: 'https://drive.google.com/file/d/1REaacJwWIWJJLJgbqBLHGqOro3g5MyEX/view?usp=drive_link' },
            { name: 'OpenShot-v3.3.0-x86_64', url: 'https://drive.google.com/file/d/1FkBNCVzOnjHlZpN2Wa2N6X7Htl-1YBXx/view?usp=sharing' },
            { name: 'Video-to-video-converter', url: 'https://drive.google.com/file/d/19-OlKrlKBZfNNMQi4VEfp2lFLhv_aVe5/view?usp=sharing' }
        ]
    },
    {
        name: 'Navegadores y Conectividad',
        icon: '🌐',
        items: [
            { name: 'Google Chrome', url: 'https://drive.google.com/file/d/1olJL8Mp_6wuHpYHx0P3FP1Y89QKS3m_H/view?usp=sharing' },
            { name: 'Internet Download Manager', url: 'https://drive.google.com/file/d/1qupsansdiJZhZLimJEPF0RWT8YJzFvNJ/view?usp=sharing' },
            { name: 'Mozilla Firefox', url: 'https://drive.google.com/file/d/1TZvOJUUehKcEQMI5V3lBk513txLBPjCm/view?usp=sharing' },
            { name: 'Opera', url: 'https://drive.google.com/file/d/1XWPOl-ZOS-8UyGka3_e47qwkrRq-pvFv/view?usp=sharing' },
            { name: 'Psiphon3', url: 'https://drive.google.com/file/d/1XYwjW2vbXoOg33cKJtausbK04NusC_Yw/view?usp=sharing' },
            { name: 'Zapya PC', url: 'https://drive.google.com/file/d/1k7OO9rq4hKAmaX4u2KuIhcZTefWyMfWs/view?usp=sharing' },
            { name: 'ProtonVPN_v4.3.13_x64', url: 'https://drive.google.com/file/d/18zotBBUkcbQTVDp2YGdnOYRID24yiqdh/view?usp=sharing' },
            { name: 'ProDownloader', url: 'https://drive.google.com/file/d/1ozsLblItGuLsC0SFXw51ipowwnG4-60o/view?usp=sharing' },
            { name: 'MyPublicWiFi', url: 'https://drive.google.com/file/d/1nxNDSZ8ZEFzbxoLie2sITohqvll1Bis_/view?usp=sharing' },
            { name: 'FreeDownloader', url: 'https://drive.google.com/file/d/1I7jvx0WuxfoGyqgD2MMfS1qcNnl_9Syo/view?usp=sharing' },
            { name: 'JDownloader 2', url: 'https://drive.google.com/file/d/1dMAJ9GEf8IUD_BUTsKLFlhKKT4puH5KE/view?usp=sharing' },
            { name: 'Proxifier', url: 'https://drive.google.com/file/d/1fLbz9vB4spa552_yg8p1LzsuRFLvqm1C/view?usp=sharing' }
        ]
    },
    {
        name: 'Utilidades',
        icon: '🛠️',
        items: [
            { name: 'Hasleo Disk Clone 5.8.2.0', url: 'https://drive.google.com/file/d/1ocpSrM7IdFmfWhY3bCLsdeMVBnkyjlpl/view?usp=sharing' },
            { name: 'BitWarden', url: 'https://drive.google.com/file/d/1uoVskqXWL_3GqdB99op6vGMj-0EaIAqt/view?usp=sharing' },
            { name: 'AutoHotKey', url: 'https://drive.google.com/file/d/1mk94mTnDEA_VOq0sakGCbUfh7nFAJ3HS/view?usp=sharing' }
        ]
    },
    {
        name: 'Herramientas del sistema',
        icon: '🔧',
        items: [
            { name: 'Rufus 4.15', url: 'https://drive.google.com/file/d/17Dnm3-L3-39IdDDFDA4eg4nz22b00b-z/view?usp=sharing' },
            { name: 'HardDiskSentinel', url: 'https://drive.google.com/file/d/12B0KUvwliy4Csbs79I73XK_CPuWN2cHO/view?usp=sharing' }
        ]
    }
];
