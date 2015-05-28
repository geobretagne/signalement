<?php
/**
 * Convertit les fichier "evolution" de la BAN en fichier CSV qui respecte la nomenclature SIGNALEMENT - CIGAL
 * 
 * Auteur : Benjamin Malan - Région Alsace 
 * Date : 17/03/2015
 * 
**/
$epsg = $_GET["epsg"];

$dossier1 = "C:\Users\Malanb\Documents\BAN_pour_benjamin".DIRECTORY_SEPARATOR; //truc
$dossier3 = "../evolution".DIRECTORY_SEPARATOR; //truc

//ouverture des fichiers "evolution"  (voie, troncon, adresse, evolution) et du fichier de communes
$f_v = $dossier3."voie_provisoire.csv"; //truc
$f_t = $dossier3."troncon_provisoire.csv";//truc
$f_a = $dossier3."adresse_provisoire.csv";//truc
$f_e = $dossier3."evolution.csv";//truc
$f_c = $dossier3."communes.csv";//truc

$h_v = @fopen($f_v, "r");
$h_t = @fopen($f_t, "r");
$h_a = @fopen($f_a, "r");
$h_e = fopen($f_e, "r");
$h_c = fopen($f_c, "r");
 
//prélocation
$evolution = array();


//________________________________________________________________________________//
//..............lecture et préparation de la matrice PHP $evolution...............//
//________________________________________________________________________________//

//__________________________________________________________________//
//........................evolution.csv.............................//
//__________________________________________________________________//

$rang=0;

//BLOC 1 : création du squelette de la matrice $evolution (voir graphe "Matrice PH")
while (($data_e = fgetcsv($h_e, 20000, ';')) !== FALSE){
	if($rang>0)
	{
	$evolution[$data_e[0]]=array
		(
		"date_fin_traitement" => $data_e[4],  //4 pour date_creation   6 pour date_fin_traitement
		"statut" => $data_e[10],
		"voie" => array("nom_minuscule"=>"", "code_insee"=>""),
		"troncon" => array(),
		"adresse" => array(),
		"type_evolution" => $data_e[3]
		);
	}
$rang++;	
}

fclose($h_e);

//__________________________________________________________________//
//........................voie_provisoire.csv.......................//
//__________________________________________________________________//

$rang=0;

while (($data_v = fgetcsv($h_v, 20000, ';')) !== FALSE){
	if($rang>0)
	{
	$evolution[$data_v[1]]["voie"]["nom_minuscule"]=$data_v[2];
	$evolution[$data_v[1]]["voie"]["code_insee"]=$data_v[6];
	}
$rang++;	
}

fclose($h_v);

//__________________________________________________________________//
//.....................troncon_provisoire.csv.......................//
//__________________________________________________________________//

$rang=0;

//function str2float($str){return(floatval($str));} //convertit en float

while (($data_t = fgetcsv($h_t, 60000, ';')) !== FALSE){
	if($rang>0)	
	{
	$geom = str_replace(array("LINESTRING(",")"), "",$data_t[17]);
	$geom = strstr($geom, ",", true);
	$geom = array_map("floatval",explode(" ",$geom));
	array_push($evolution[$data_t[1]]["troncon"],$geom); //remplit tous les troncons à la suite.
	}	
$rang++;	
}

fclose($h_t);

//__________________________________________________________________//
//.....................adresse_provisoire.csv.......................//
//__________________________________________________________________//

$rang=0;

while (($data_a = fgetcsv($h_a, 50000, ';')) !== FALSE){
	if($rang>0)	
	{

	$geom = str_replace(array("POINT(",")"), "",$data_a[15]);
	$geom = array_map("floatval",explode(" ",$geom));

	array_push
		($evolution[$data_a[1]]["adresse"],array
			(
			"numero"=>$data_a[4],
			"indice_de_repetition"=>$data_a[5],
			"xy"=>$geom
			)
		);
	}
$rang++;	
}

fclose($h_a);

//________________________________________________________________________________//
//..............Transformer les code_insee en nom_commune.........................//
//________________________________________________________________________________//

while (($data_c = fgetcsv($h_c, 1000, ';')) !== FALSE)
{
	$communes[$data_c[0]] = $data_c[1];
}

fclose($h_c);

//________________________________________________________________________________//
//...................création du fichier signevolution.csv........................//
//________________________________________________________________________________//

$dossier2 = "C:\Users\Malanb\Documents\panier".DIRECTORY_SEPARATOR; //truc
$dossier4 = "../imports".DIRECTORY_SEPARATOR; //truc
$signevolution = "signevolution_".date("Y")."_".date("m")."_".date("d")."_".date("H")."h".date("i")."m".date("s");
$path2signevolution = $dossier4.$signevolution.".csv";
$h_sign = @fopen($path2signevolution, "w"); //truc

$entete = "depco;libco;type_ref;nature_ref;acte_ref;comment_ref;mel;contributeur;url_1;url_2;date_saisie;nature_mod;x;y";
fwrite($h_sign,$entete);

$k=0; //compteur de signalements
// différents type d'evolution
$type_evolution = array(
"voie"=>array(1=>"Ajout voie manquante","Modification voie correctif","Modification voie lourde","Creation voie sur troncon existant","Prolongement voie","Ajout voie AD"),
"adresse"=>array(6=>"Ajout voie AD","Nouvelles adresses voie existante","Modification semantique adresse","Modification geometrique adresse","Suppression adresse"),
"modification"=>array("Modification semantique adresse","Modification geometrique adresse","Suppression adresse","Modification voie correctif","Modification voie lourde"),
"creation"=>array("Ajout voie AD","Ajout voie manquante","Nouvelles adresses voie existante","Creation voie sur troncon existant")
);


foreach ($evolution as $key => $dossier)
{
	if(in_array($dossier["type_evolution"],$type_evolution["adresse"])){
	foreach ($dossier["adresse"] as $adresse)
	{
	//création du signalement adresse (boucle)
	$depco = $dossier["voie"]["code_insee"];
	if($depco==""){$depco="99999";};
	
	$libco = $communes[$dossier["voie"]["code_insee"]];
	if($libco==""){$libco="CASIMIR";};
	
	$type_ref = "adresse";
	
	$nature_ref = "creation";
	if(in_array($dossier["type_evolution"] , $type_evolution["modification"])){$nature_ref = "modification";}
	
	$acte_ref = "oui";
	$comment_ref = $adresse["numero"]." ".$dossier["voie"]["nom_minuscule"];
	$mel = "benjamin.malan@region-alsace.fr";
	$contributeur = "public";
	$url_1 = "";
	$url_2 = "";
	$date_saisie = substr($dossier["date_fin_traitement"],0,10);
	$nature_mod = "";
	$x = $adresse["xy"][0];
	$y = $adresse["xy"][1];


	$ligne = "\n"."$depco;$libco;$type_ref;$nature_ref;$acte_ref;$comment_ref;$mel;$contributeur;$url_1;$url_2;$date_saisie;$nature_mod;$x;$y";
	fwrite($h_sign, $ligne);
	$k++;
	}
	}

if(in_array($dossier["type_evolution"],$type_evolution["voie"])){	
$pos_troncon_geom = round((count($dossier["troncon"]))/2,0)-1; //troncon du milieu

//création du signalement voie
$depco = $dossier["voie"]["code_insee"];
$libco = $communes[$dossier["voie"]["code_insee"]];
$type_ref = "voie";

$nature_ref = "creation";
if(in_array($dossier["type_evolution"] , $type_evolution["modification"])){$nature_ref = "modification";}

$acte_ref = "oui";
$comment_ref = $dossier["voie"]["nom_minuscule"];
$mel = "benjamin.malan@region-alsace.fr";
$contributeur = "public";
$url_1 = "";
$url_2 = "";
$date_saisie = substr($dossier["date_fin_traitement"],0,10);
$nature_mod = "";
$x = $dossier["troncon"][$pos_troncon_geom][0];
$y = $dossier["troncon"][$pos_troncon_geom][1];


$ligne = "\n"."$depco;$libco;$type_ref;$nature_ref;$acte_ref;$comment_ref;$mel;$contributeur;$url_1;$url_2;$date_saisie;$nature_mod;$x;$y";
fwrite($h_sign, $ligne);
$k++;
}
	
}


fclose($h_sign);


$reussi = 'Chargement de la table "EVOLUTION" réussi ! '."\n".$k." signalements créés.";
echo "{success:true, import1:".json_encode($signevolution.".txt").", message:".json_encode($reussi)."}"; 

$lefichierimporte = $signevolution; //$lefichierimporte est la variable demandée pour transformer en xml dans csv2xml
require('./csv2xml.php'); //truc
?>
