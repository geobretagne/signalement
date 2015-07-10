<?php
error_reporting(-1);
$epsg=$_GET["epsg"];
$dossier = 'imports/';
$fichier = basename($_FILES['lefichiercsv']['name']);    //signalement_bidon.csv
$taille_maxi = 400000000;
$taille = filesize($_FILES['lefichiercsv']['tmp_name']);
$extensions = array('.csv', '.txt');
$extension = strrchr($_FILES['lefichiercsv']['name'], '.'); //.csv

$nomDestination = "import_".date("Y")."_".date("m")."_".date("d")."_".date("H")."h".date("i")."m".date("s")."_";
$fichier_nom = basename($fichier,$extension);  // signalement_bidon
$lefichierimporte = $nomDestination.$fichier_nom; 



//Début des vérifications de sécurité...
if(!in_array($extension, $extensions)) //Si l'extension n'est pas dans le tableau
{
     $erreur = 'Vous devez uploader un fichier de type csv ou txt...';
}
if($taille>$taille_maxi)
{
     $erreur = 'Le fichier est trop gros...';
}
if(!isset($erreur)) //S'il n'y a pas d'erreur, on upload
	{
		 //On formate le nom du fichier ici...
		 $fichier = strtr($fichier, 
			  'ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïðòóôõöùúûüýÿ', 
			  'AAAAAACEEEEIIIIOOOOOUUUUYaaaaaaceeeeiiiioooooouuuuyy');
		 $fichier = preg_replace('/([^.a-z0-9]+)/i', '-', $fichier);
		 if(move_uploaded_file($_FILES['lefichiercsv']['tmp_name'], "../imports/".$lefichierimporte.".csv")) //Si la fonction renvoie TRUE, c'est que ça a fonctionné...
		 {
		//Traitement du csv pour transformation en xml dans le repertoire xml_out
		$epsg=$_GET["epsg"];
		require('./csv2xml.php');
		//fin du traitement 
		
		$reussi = "Chargement du fichier réussi !";
	 	}
		 
	}
elseif(isset($erreur))
	{
		echo '{success:false, message:'.json_encode($erreur).'}'; //message d'erreur, si le passage des contrôles n'a pas été concluant.
	}

if(isset($reussi))    // la variable a été définie dans le traitement plus haut
{
	echo "{success:true, import1:".json_encode($lefichierimporte.".txt").", message:".json_encode($reussi)."}"; //message de succès
}
?>
