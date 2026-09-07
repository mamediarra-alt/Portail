-- Les liens internes du Restaurant sont relatifs (menu.php...) : il faut servir depuis /public/.
UPDATE application SET url_acces = 'http://localhost/sama_resto/public/' WHERE code = 'RESTAURANT';
