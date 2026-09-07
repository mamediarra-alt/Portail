-- Dev : l'application EDUSN visible par l'utilisateur est son frontend (Vite) sur le port 5173.
UPDATE application SET url_acces = 'http://localhost:5173/' WHERE code = 'EDUSN';
