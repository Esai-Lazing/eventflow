<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ $ogUrl }}">
    <meta property="og:title" content="{{ $title }}">
    <meta property="og:description" content="{{ $description }}">
    <meta property="og:image" content="{{ $image }}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ $ogUrl }}">
    <meta property="twitter:title" content="{{ $title }}">
    <meta property="twitter:description" content="{{ $description }}">
    <meta property="twitter:image" content="{{ $image }}">

    <script>
        // Redirection vers l'invitation réelle sur le frontend
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const frontendUrl = "https://eventflow.lazdev-consult.com";
        window.location.href = `${frontendUrl}/invite/{{ $slug }}${token ? '?token=' + token : ''}`;
    </script>
</head>
<body style="background: #fdfdfc; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; color: #1b1b18;">
    <div style="text-align: center;">
        <div style="width: 40px; height: 40px; border: 3px solid #f53003; border-top-color: transparent; border-radius: 50%; animate: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <p>Chargement de votre invitation...</p>
    </div>
    <style>
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</body>
</html>
