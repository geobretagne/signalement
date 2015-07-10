<?php
/**
 * Convertit un fichier CSV en fichier de type XML  - puis en requête POST - pour SIGNALEMENT
 * 
 * Auteur : Benjamin Malan - Région Alsace 
 * Date : 24/02/2015
 * 
 * 
 * Paramètres en entrée :
 * @param string $file			nom du csv (sans extension) déposé dans le dossier .\entree
 * @param string $rows			Nom d'une occurence du conteneur
 * Retourne en sortie :
 * @return string				Chaîne de caractère type XML			
 */
 
	//Entrée de la fonction csv2xml : nom de la couche la couche WFS (balise xml)
	$occurence = 'feature:signalement_adresse';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////	
//********************************   Fonction csv2xml ********************************************************
////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
 
	function csv2xml($file, $epsg, $rows = 'row'){
	 $reponse="";
     $row = 0;
     $cols = 0;
     $titles = array();
	 $file = "../imports".DIRECTORY_SEPARATOR.$file; //fichier CSV en entrée
	
     if($handle = @fopen($file, 'r'))
{

	 // création des balises FEATURE
     while (($data = @fgetcsv($handle, 2000, ';')) !== FALSE){
	
          if ($row > 0) $reponse .= "<{$rows}".' xmlns:feature="https://www.cigalsace.org/geoserver/cigal_edit/"'.">";
          if (!$cols) $cols = count($data);
          for ($i = 0; $i < $cols; $i++){
               
			   // utilise la première ligne pour stocker les titres des balises
			   if ($row == 0){
                    $titles[$i] = $data[$i];
                    continue;
               }
               
			   //traite le cas des coordonnées
			   if ($titles[$i]=="x") {
			   $reponse .= "".'<feature:the_geom>'."".'<gml:Point xmlns:gml="http://www.opengis.net/gml" srsName="'.$epsg.'">'."".str_replace(' ', '-', strtolower("<gml:pos>"));
               $reponse .= $data[$i]." ".$data[$i+1]; // x et y capturés
               $reponse .= str_replace(' ', '-', strtolower("</gml:pos>")).'</gml:Point>'."</feature:the_geom>"; 
			    
			   }
			   
			   if($titles[$i]=="y") {} //permet d'éluder l'attribut y déjà pris en compte
			   
			   //le format de date est déjà au bon format. Pas besoin de le changer dans ce fichier

			   // traite le cas d'attributs simples
			   else {
               $reponse .= str_replace(' ', '-', strtolower("<feature:{$titles[$i]}>"));
               $reponse .= $data[$i];
               $reponse .= str_replace(' ', '-', strtolower("</feature:{$titles[$i]}>"));	
			   }   
	  		   
							   
		  }
          if ($row > 0) $reponse .= "</{$rows}>"; // on ferme la balise FEATURE et on passe à la ligne suivante.
          $row++;
     }

  
     fclose($handle);

}
     return $reponse; // le texte xml à écrire dans un fichier texte de stockage pour une future requête WFS-T
	}
	
	
//////////////////////////////////////////////////////////////////////////////////////////////////////////////	
//********************************   Appel de la fonction csv2xml ********************************************
////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	
	
	$texteXML=csv2xml($lefichierimporte.".csv",$epsg,$occurence); 
	// la variable php $lefichierimporte est un String qui contient le nom du fichier sans extension, et placé dans le repertoire ../imports 

	// corps de la requête POST WFS-T
$post = '<wfs:Transaction xmlns:wfs="http://www.opengis.net/wfs" service="WFS" version="1.1.0" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><wfs:Insert>'.$texteXML.
	'</wfs:Insert></wfs:Transaction>';	
		
//////////////////////////////////////////////////////////////////////////////////////////////////////////////	
//********************************   Ecriture du XML *********************************************************
////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
	
	
	//On récupère le texte (language XML) dans un fichier au format .txt placé dans le dossier '.\xml_out'
	if($texteXML==""){
		$message = "\n\n"."Il n'y a aucun fichier CSV a transformer !"."\n"."Verifiez que le dossier 'imports' contient bien le fichier CSV.";
	} else {
		//On enlève les blancs (espace, tabulations, etc)
		$file = basename($lefichierimporte,".csv");
		$texteXML= trim($texteXML);
		$fichierXML="../xml_out".DIRECTORY_SEPARATOR.$file.".txt"; //truc
		
		if (!$handle = fopen($fichierXML, 'w')){
			$message =  "\n\n"."Impossible d'ouvrir le fichier ($fichierXML)";
			exit;
		}
	
		//On écrit le contenu dans le fichier .xml
		if(fwrite($handle,$post) === FALSE){
			$message =  "\n\n"."Impossible d'écrire le fichier ";
			exit;
		}
			
		//On ferme le fichier
		fclose($handle);
	}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////	
//***********************************************   FIN ******************************************************
////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
?>
