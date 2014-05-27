<?php
//error_reporting(0);
include_once("../secret/signalement.php");
$dossier = 'imports/';
$fichier = basename($_FILES['lefichiercsv']['name']);
$taille_maxi = 4000000;
$taille = filesize($_FILES['lefichiercsv']['tmp_name']);
$extensions = array('.csv', '.txt');
$extension = strrchr($_FILES['lefichiercsv']['name'], '.'); 
$nomDestination = "import".date("YmdHis").$extension;
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
		 if(move_uploaded_file($_FILES['lefichiercsv']['tmp_name'], '../'.$dossier . $nomDestination)) //Si la fonction renvoie TRUE, c'est que ça a fonctionné...
		 {
			// traitement du fichier
			$row = 1;
			if (($handle = fopen("../".$dossier . $nomDestination, "r")) !== FALSE) {

				$dbh = pg_connect($pg_connect_);
				 if (!$dbh) {
					 echo '{success:false, message:'.json_encode("Connexion à la Base Impossible").'}';	 
					 
					 die();
				 }
				$data = fgetcsv($handle, 1000, ";"); // Pour aller à la deuxième ligne
				pg_query($dbh,"begin"); 
				while (($data = fgetcsv($handle, 1000, ";")) !== FALSE) {
				   
				   $row++;
				   
				 $commune = str_replace ( "'", "''", $data[1]);	
				 $test = str_replace ( "'", "''", $data[5]);
				 $sql = "INSERT INTO a_05_adresses.signalement_adresse (depco, libco, type_ref, nature_ref, acte_ref,
				 comment_ref, mel, contributeur, url_1, url_2, date_saisie, import, geom) VALUES( '$data[0]',
				 '$commune', '$data[2]', '$data[3]', '$data[4]', '$test',
				 '$data[6]', '$data[7]', '$data[8]', '$data[9]', DATE '$data[10]', '$nomDestination',
				 ST_PointFromText('POINT($data[11] $data[12])', 2154))";
				 
				 $result = pg_query($dbh, $sql);
				
				 if (!$result) {
					 pg_query($dbh,"rollback");
					 echo '{success:false, message:'.json_encode("erreur dans le traitement de : " .$nomDestination).'}';
					 die();
				 }
					 
				} // fin while
				pg_query($dbh,"commit");				
				// free memory
				pg_free_result($result);
				fclose($handle);
				// close connection
				pg_close($dbh);
				echo '{success:true, import1:'.json_encode($nomDestination).", message:".json_encode("Chargement réussi de : " .$nomDestination).'}';
			} // fin handle open
						
			  
			//fin du traitement 
		 }
		 
	}
else
	{
		echo '{success:false, message:'.json_encode($erreur).'}';
	}
?>
