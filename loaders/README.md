# Loaders Webflow MY BUSINESS LIFE

Chaque fichier `*-loader.html` est un snippet à coller dans un composant **Embed** Webflow sur la page correspondante.

Le contenu est chargé depuis la source statique GitHub, puis les liens internes, le canonical et les assets sont réécrits vers `https://mybusinesslife.fr`. Les pages source GitHub sont prévues pour être en `noindex` et rediriger les visiteurs vers le domaine de production.

## Correspondance recommandée

- `/` : `home-loader.html`
- `/contact` : `contact-loader.html`
- `/a-propos` : `a-propos-loader.html`
- `/particuliers` : `particuliers-loader.html`
- `/professionnels` : `professionnels-loader.html`
- `/services/developpement-web` : `developpement-web-loader.html`
- `/services/developpement-logiciel` : `developpement-logiciel-loader.html`
- `/services/reparation-ordinateur` : `reparation-ordinateur-loader.html`
- `/services/automatisation` : `automatisation-loader.html`
- `/services/strategie-digitale` : `strategie-digitale-loader.html`
- `/blog` : `blog-loader.html`
- `/blog/diagnostic-digital` : `blog-diagnostic-digital-loader.html`
- `/blog/site-web-qui-convertit` : `blog-site-web-qui-convertit-loader.html`
- `/blog/logiciel-sur-mesure` : `blog-logiciel-sur-mesure-loader.html`
- `/mentions-legales` : `mentions-legales-loader.html`
- `/politique-confidentialite` : `politique-confidentialite-loader.html`
- `/politique-cookies` : `politique-cookies-loader.html`
- `/conditions-utilisation` : `conditions-utilisation-loader.html`
- `/ebook` : `ebook-loader.html`

## SEO Webflow

Le loader met à jour les metas côté navigateur, mais il est préférable de renseigner aussi les titres, descriptions et canonicals directement dans les paramètres SEO de chaque page Webflow.
