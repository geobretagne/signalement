<?php

date_default_timezone_set('Europe/Paris');
header('Content-Type: application/rss+xml; charset=UTF-8');
header('Connection: keep-alive');
error_reporting(-1);

//........... Récupération du filtre CQL généré sur SIGNALEMENT dans src/js/rss.js
$filtre=$_GET["cql_filter"];
$filtre = str_replace(' ','+',$filtre); // les requêtes CQL ne marchent que lorsque les espaces sont remplacés par des +

//........... Requête GETMAP sur le flux OGC (WMS) de signalements. Params : format = application/rss+xml  
$rss = @file_get_contents("https://www.cigalsace.org/geoserver/wms?layers=cigal_edit:signalement_adresse&srs=EPSG:2154&format=application/rss+xml&version=1.1.1&request=GetMap&bbox=934173,6705656,1098054,6901029&service=wms&width=1&height=1&cql_filter=".$filtre);

//........... Remplacement de textes / titres ... HTML
$rss = str_replace("cigal_edit:signalement_adresse","SIGN'Adresse CIGAL",$rss);
$rss = str_replace('Atom"','Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"',$rss);

$rss = str_replace("Couche de signalements production","La couche Signalement voies adresses en Alsace recense les ajouts, suppressions et modifications operes sur les voies et adresses en Alsace",$rss); // nouvelle description

$rss = str_replace("<title>signalement_adresse.","<title>Signalement ",$rss); // Nom du signalement
$rss = str_replace('rel="self"','rel="self" type="application/rss+xml"',$rss); // manque un paramètre

// Remplacement de code HTML pour une meilleure présentation
$rss = str_replace('<strong><span class="atr-name">depco</span>:</strong>','<strong><span class="atr-name">Code INSEE</span> :</strong>',$rss);
$rss = str_replace('<strong><span class="atr-name">libco</span>:</strong>','<strong><span class="atr-name">Nom Commune</span> :</strong>',$rss);
$rss = str_replace('<strong><span class="atr-name">type_ref</span>:</strong>','<strong><span class="atr-name">Référentiel</span> :</strong>',$rss);
$rss = str_replace('<strong><span class="atr-name">nature_ref</span>:</strong>','<strong><span class="atr-name">Nature</span> :</strong>',$rss);
$rss = str_replace('<strong><span class="atr-name">nature_mod</span>:</strong>','<strong><span class="atr-name">Type de modification</span> :</strong>',$rss);
$rss = str_replace('<strong><span class="atr-name">comment_ref</span>:</strong>','<strong><span class="atr-name">Commentaires</span> :</strong>',$rss);
$rss = str_replace('<strong><span class="atr-name">mel</span>:</strong>','<strong><span class="atr-name">Email</span> :</strong>',$rss);
$rss = str_replace('<strong><span class="atr-name">date_saisie</span>:</strong>','<strong><span class="atr-name">Date de saisie</span> :</strong>',$rss);
$rss = str_replace('<strong><span class="atr-name">contributeur</span>:</strong>','<strong><span class="atr-name">Contributeur</span> :</strong>',$rss);

$rss = str_replace('<strong><span class="atr-name">url_1</span>:</strong>','<strong><span class="atr-name">Pi&egrave;ce jointe n&deg;1</span> :</strong>',$rss);
$rss = str_replace('<strong><span class="atr-name">url_2</span>:</strong>','<strong><span class="atr-name">Pi&egrave;ce jointe n&deg;2</span> :</strong>',$rss);

//.. ajout d'une image cliquable pour ouvrir la pièce jointe
$rss = str_replace('<span class="atr-value">http://www.cigalsace.org','<span class="atr-value"><a target="_blank" href="http://www.cigalsace.org',$rss);
$rss = str_replace('.pdf</span></li>','.pdf"><img src="https://www.cigalsace.org/signalement/src/img/attach.png"/></a></span></li>',$rss); //pour extension pdf
$rss = str_replace('.doc</span></li>','.doc"><img src="https://www.cigalsace.org/signalement/src/img/attach.png"/></a></span></li>',$rss); //pour extension doc
$rss = str_replace('.docx</span></li>','.docx"><img src="https://www.cigalsace.org/signalement/src/img/attach.png"/></a></span></li>',$rss); //pour extension docx


//.. Suppression de ACTE_REF
$rss = str_replace('<li><strong><span class="atr-name">acte_ref</span>:</strong> <span class="atr-value">non</span></li>','',$rss); //non
$rss = str_replace('<li><strong><span class="atr-name">acte_ref</span>:</strong> <span class="atr-value">oui</span></li>','',$rss); //oui


//........... Image d'illustration
$rss = str_replace('<h4>signalement_adresse</h4>','<img src="https://www.cigalsace.org/signalement/src/img/cigal.png">',$rss);

$rss = str_replace('voie</span>','voie <img border="0" src="https://www.cigalsace.org/signalement/src/img/voie.png"></span>',$rss);
$rss = str_replace('adresse</span>','adresse <img border="0" src="https://www.cigalsace.org/signalement/src/img/adresse.png"></span>',$rss);
$rss = str_replace('projet</span>','projet <img border="0" src="https://www.cigalsace.org/signalement/src/img/projet.png"></span>',$rss);


//........... balises manquantes
$rss = str_replace('Alsace</description>','Alsace</description><dc:publisher>SIG REGION</dc:publisher><ttl>01</ttl><lastBuildDate>'.date(DATE_RFC2822).'</lastBuildDate>',$rss);
$rss = str_replace('<link><![CDATA[https://www.cigalsace.org/geoserver/wms?service=wms&request=GetMap&version=1.1.1&format=application%2Frss+xml&layers=cigal_edit%3Asignalement_adresse&styles=point&cql_filter=depco+IS+NOT+NULL&height=1&width=1&transparent=false&bbox=934173.0%2C6705656.0%2C1098054.0%2C6901029.0&srs=EPSG%3A2154]]></link>','<link><![CDATA[https://www.cigalsace.org/signalement/]]></link>',$rss);


//........... Changement du link de chaque signalement
$rss = str_replace('<link><![CDATA[https://www.cigalsace.org/geoserver/wms/reflect?featureid=signalement_adresse.','<link><![CDATA[https://www.cigalsace.org/signalement/?feature=',$rss);
$rss = str_replace('&layers=cigal_edit%3Asignalement_adresse&format=application%2Fatom%2Bxml','',$rss);

// Ajout de pubDate pour chaque signalement

//... en recherchant toutes les dates déjà présentes dans le rss publié par le service WMS, en les stockant dans des variables PHP, et en les réutilisant pour créer une balise XML <pubDate>, très importante pour "nourir" les flux RSS.

// position des balises <title> (=signalement)
$rech_title = 1;
$i=1;
while ($rech_title !== false) {
    $rech_title = stripos($rss, '<title>Signalement',$rech_title+1);
	$mat_title[$i] = $rech_title;
	$i++;
}

// position de l'information date_saisie dans les balises <description>
$rech_balise_date = 1;
$j=1;
$balise_date = '<li><strong><span class="atr-name">date_saisie</span>:</strong> <span class="atr-value">';
while ($rech_balise_date !== false) {
    $rech_balise_date = stripos($rss, $balise_date,$rech_balise_date+1);
	$mat_balise_date[$j] = $rech_balise_date;
	$mat_date[$j] = substr($rss, $mat_balise_date[$j]+strlen($balise_date), 15);
	$j++;
}

// création et insertion de la balise nouvellement crée : <pubDate>
$k=1;
$count_signal = count($mat_date);
while ($k < $count_signal) {
    $rss = substr_replace($rss,'<pubDate>'.date("D, d M Y H:i:s", strtotime($mat_date[$count_signal - $k])).'</pubDate>',$mat_title[$count_signal - $k],0);
	$k++;
}

//renvoie le RSS lorsqu'on appelle le PHP avec des paramètres de filtres.
print $rss;
?>
