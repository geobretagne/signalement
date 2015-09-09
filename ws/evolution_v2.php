<?php 
//chemin vers les évolutions (fichiers JSON bruts...)
$full = "https://www.cigalsace.org/signalement/evolution/evolutions.json";
$short = "https://www.cigalsace.org/signalement/evolution/evolutions_extrait.json";
$alsace = "https://www.cigalsace.org/signalement/evolution/evolutions-alsace.json";

//récupère les évolutions...
$evo_json = @file_get_contents($alsace);
$evo = json_decode($evo_json, true);

$tracage_evo = array(); //matrice qui contient les ID des évolutions déjà traitées par SIGN'Adresse.
$type = array();

// on récupère l'EPSG des evolutions (2154)
$epsg = $_GET["epsg"];

// Départements en Alsace.
$departement = array("67","68");

$k=0; //compteur de signalements

// Différents types d'évolutions...
$type_evolution = array(
"voie"=>array(1=>"Ajout voie manquante","Modification voie correctif","Modification voie lourde","Creation voie sur troncon existant","Prolongement voie","Ajout voie AD"),
"adresse"=>array(6=>"Ajout voie AD","Nouvelles adresses voie existante","Modification semantique adresse","Modification geometrique adresse","Suppression adresse","Modification voie correctif","Modification voie lourde"),
"modification"=>array("Modification semantique adresse","Modification geometrique adresse","Suppression adresse","Modification voie correctif","Modification voie lourde"),
"creation"=>array("Ajout voie AD","Ajout voie manquante","Nouvelles adresses voie existante","Creation voie sur troncon existant")
);


//________________________________________________________________________________//
//.............Fonction convertion un fichier CSV en matrice PHP..................//
//________________________________________________________________________________//

//***** $path = chemin vers le CSV
//***** return $matrice = matrice PHP qui contient la première colonne en indice, et la deuxième colonne en valeur.

function csv2mat($path)
{
	if($handle = fopen($path, "r")) {
		while (($data = fgetcsv($handle, 1000, ';')) !== FALSE)
		{
			$matrice[$data[0]] = $data[1];
		}
	}
	fclose($handle);

	return $matrice;
}


// Chargement des évolutions déjà traitées, des emails des utilisateurs, et des communes.
$f_e = "../evolution/tracage_evo.csv";
$f_u = "../evolution/users.csv";
$f_c = "../evolution/communes.csv";
$tracage_evo = csv2mat($f_e);	
$mails = csv2mat($f_u);	
$communes = csv2mat($f_c);	


//________________________________________________________________________________//
//...................Fonction d'extraction des adresses...........................//
//________________________________________________________________________________//

//***** $truc = evolution
//***** return : signalement (ligne CSV)

function a_extract($truc)
{
	global $mails, $communes, $type_evolution, $signalement, $k;
	
	
    	foreach ($truc["adresses_provisoires"] as $adresse)
	{
	// création du signalement adresse (boucle)
	$depco = $adresse["voie_provisoire"]["code_insee"];
	if($depco==""){$depco="99999";};
	
	$libco = $communes[$depco];
	if($libco==""){$libco="non defini";};
	
	$type_ref = "adresse";
	
	$nature_ref = "creation";
	if(in_array($truc["type_evolution"] , $type_evolution["modification"])){$nature_ref = "modification";}
	if($truc["type_evolution"] == "Suppression adresse"){$nature_ref = "suppression";}
	
	$acte_ref = "non";
	
	
	$comment_ref = $adresse["numero"];
	if($adresse["indice_de_repetition"]) {$comment_ref .=$adresse["indice_de_repetition"];};
	$comment_ref .= " ".$adresse["voie_provisoire"]["nom_minuscule"];
	
	
	$mel = $mails[$truc["id_user"]];
	$contributeur = "WEBPART";
	$url_1 = "";
	$url_2 = "";
	$date_saisie = $truc["date_fin_traitement"];
	
	$nature_mod = "";
	if($truc["type_evolution"] == "Modification geometrique adresse"){$nature_mod = "geometrie";}
	if($truc["type_evolution"] == "Modification semantique adresse"){$nature_mod = "adresse";}
	// if($truc["type_evolution"] == "Modification voie correctif"  or  $truc["type_evolution"] == "Modification voie lourde"){$nature_mod = "geometrie";}
	
	
	$geom = str_replace(array("POINT(",")"), "",$adresse["geometrie"]["data"]);
	$geom = array_map("floatval",explode(" ",$geom));
	$x = $geom[0];
	$y = $geom[1];
	$wkt = $adresse["geometrie"]["data"];
	$id_evo = $truc["uuid"];
	
	$ligne = "$depco;$libco;$type_ref;$nature_ref;$acte_ref;$comment_ref;$mel;$contributeur;$url_1;$url_2;$date_saisie;$nature_mod;$x;$y;$wkt;$id_evo";

	$signalement .= "\n".$ligne;
	$k++;
	}
}

//________________________________________________________________________________//
//...................Fonction d'extraction des voies..............................//
//________________________________________________________________________________//

function v_extract($truc)
{
	global $mails, $communes, $type_evolution, $signalement, $k;
	
	
    	foreach ($truc["troncons_provisoires"] as $troncon)
	{
	// création du signalement adresse (boucle)
	$depco = $troncon["voie_provisoire_gauche"]["code_insee"];
	if($depco==""){$depco="99999";};
	
	$libco = $communes[$depco];
	if($libco==""){$libco="non defini";};
	
	$type_ref = "voie";
	
	$nature_ref = "creation";
	if(in_array($truc["type_evolution"] , $type_evolution["modification"])){$nature_ref = "modification";}

	
	$acte_ref = "non";
	
	

	$comment_ref = $troncon["voie_provisoire_gauche"]["nom_minuscule"];
	
	
	$mel = $mails[$truc["id_user"]];
	$contributeur = "WEBPART";
	$url_1 = "";
	$url_2 = "";
	$date_saisie = $truc["date_fin_traitement"];
	
	$nature_mod = "";
	if($truc["type_evolution"] == "Modification geometrique adresse"){$nature_mod = "geometrie";}
	if($truc["type_evolution"] == "Modification semantique adresse"){$nature_mod = "adresse";}
	// if($truc["type_evolution"] == "Modification voie correctif"  or  $truc["type_evolution"] == "Modification voie lourde"){$nature_mod = "geometrie";}
	
	// On utilise un sommet de la LINESTRING qui se situe à peu près au milieu du segment pour la géométrie du signalement.
	$geom = str_replace(array("LINESTRING(",")"), "",$troncon["geometrie"]["data"]);	
	$geom = str_replace(",", " ",$geom);
	$geom = array_map("floatval",explode(" ",$geom));
	
	$milieu = 2*round(((count($geom)/2)/2));
	
	$x = $geom[$milieu-2];
	$y = $geom[$milieu-1];
	
	$wkt = $troncon["geometrie"]["data"];
	$id_evo = $truc["uuid"];
	
	$ligne = "$depco;$libco;$type_ref;$nature_ref;$acte_ref;$comment_ref;$mel;$contributeur;$url_1;$url_2;$date_saisie;$nature_mod;$x;$y;$wkt;$id_evo";


	$signalement .= "\n".$ligne;

	$k++;
	}
}

// On lit le fichier des évolutions et on les traite.

$ajout_tracage_evo ="";
$signalement ="";

foreach ($evo as $truc) {

// on vérifie qu'on a pas encore traité cette évolution.
if(!$tracage_evo[$truc["uuid"]])
	{	
			//On vérifie que l'évolution a bien été commitée à l'IGN
			if($truc["statut"]== "Terminé")  
			{

		//___adresse___
		if (in_array($truc["type_evolution"],$type_evolution["adresse"]))
		{a_extract($truc);};

		//_____voie____
		if (in_array($truc["type_evolution"],$type_evolution["voie"]))
		{v_extract($truc);};

		// on garde une trace des evolutions traitées...
		$id = $truc["uuid"];
		$date_evo = date("dMY");
		$ajout_tracage_evo .= "\n"."$id;$date_evo";
		
			}
	}
	
};



//on re-ouvre le tracage des evolutions en vue de sur-ecrire les nouvelles évolutions traitées
//incrémentation des évolutions traitées dans cette extraction
if($h_tracage = fopen("../evolution/tracage_evo.csv", "a+"))
{ 
fwrite($h_tracage,$ajout_tracage_evo);
fclose($h_tracage);
}
//....................................................

$entete = "depco;libco;type_ref;nature_ref;acte_ref;comment_ref;mel;contributeur;url_1;url_2;date_saisie;nature_mod;x;y;wkt;id_evo";
$signalement = $entete.$signalement;
// echo "<pre>".$signalement."</pre>";

// archivage du CSV de signalement
$signevolution = "signevolution_".date("Y")."_".date("m")."_".date("d")."_".date("H")."h".date("i")."m".date("s");
$path2signevolution = "../imports/".$signevolution.".csv";
if($h_sign = @fopen($path2signevolution, "w"))
{
fwrite($h_sign,$signalement);
fclose($h_sign);
}

// publication du message ExtJS, et des informations pour la requete POST
$message = 'Chargement des "EVOLUTIONS" réussi ! '."\n".$k." signalements créés.";


$lefichierimporte = $signevolution; //$lefichierimporte est la variable demandée pour transformer en xml dans csv2xml_v2
require('./csv2xml_evo.php'); 

echo "{success:true, import1:".json_encode($signevolution.".txt").", message:".json_encode($message)."}"; 

?>
