<?php

$fichier = basename($_FILES['workflowcsv']['name']); //cus_vu.txt
$taille_maxi = 4000000;
$taille = filesize($_FILES['workflowcsv']['tmp_name']);
$extensions = array('.csv', '.txt');
$extension = strrchr($_FILES['workflowcsv']['name'], '.');  // .txt
$nomDestination = "traitement_".date("Y")."_".date("m")."_".date("d")."_".date("H")."h".date("i")."m".date("s")."_";

$fichier_nom = basename($fichier,$extension);  // cus_vu
$lefichierimporte = $nomDestination.$fichier_nom;  // traitement_2015_04_08_10h42m55s_cus_vu

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
		 if(move_uploaded_file($_FILES['workflowcsv']['tmp_name'], '../traitements/'. $lefichierimporte.".txt")) //Si la fonction renvoie TRUE, c'est que ça a fonctionné...
		 {
			// traitement du fichier
		$file = "../traitements".DIRECTORY_SEPARATOR.$lefichierimporte.".txt";
			$handle = @fopen($file, 'r');
			
			while (($data = @fgetcsv($handle, 2000, ';')) !== FALSE)
			{
				if ($row == 0)
				{
					$acteur = strtolower($data[0]);
				}
				if ($row > 0)
				{
					$idsignal = $data[0];
					$reponse .= "DOWN".$idsignal."UP"; // création d'une chaine avec des enchainements de DOWNidsignalUP. DOWN et UP seront remplacés par les balises dans le script .js

				}
			$row++;				
			}
			//$reponse .= '</ogc:Filter></wfs:Update></wfs:Transaction>';
			$reussi = "Chargement du fichier réussi ! Signalement(s) marqué(s) comme vu(s) !";
		 }

echo "{success:true, acteur:".json_encode($acteur).", idsignal:".json_encode($reponse).", message:".json_encode($reussi).'}';			 
	}
else
	{
		echo '{success:false, message:'.json_encode($erreur).'}';
	}
?>
