-- Dev : l'app Restaurant a des chemins d'assets absolus /sama_resto/ ; on la sert à cette racine.
UPDATE application SET url_acces = 'http://localhost/sama_resto/' WHERE code = 'RESTAURANT';
