<?php
date_default_timezone_set('Europe/Paris');
header('Content-Type: application/rss+xml; charset=UTF-8');

 error_reporting(-1);

$connexion="";
if (!$fp = fopen("dev/log/log.txt","r")) {
echo "Echec de l'ouverture du fichier";

exit;

}

else {
 while(!feof($fp)) {
 // On récupère une ligne
  $Ligne = fgets($fp,255);

 // On affiche la ligne


 // On stocke l'ensemble des lignes dans une variable
  $connexion .= $Ligne;
}

$dbh=pg_connect($connexion);





	if (!$dbh) {
			echo '{success:false, message:'.json_encode("Connexion à la Base Impossible").'}';	 
					 
			 die();
			 }
			 
			 if (isset($_GET["cql_filter"])) {
			 $p=$_GET["cql_filter"];
			 if(stristr($p,"intersect"))
			 {
			 $p=str_replace(")))","))',2154))",$p);
			 $p=str_replace("POLYGON","GeomFromText('POLYGON",$p);
			
				
				$sql="Select idsignal,
								depco ,
								libco ,
								type_ref ,
								nature_ref ,
								acte_ref ,
								comment_ref ,
								mel ,
								url_1 ,
								url_2 ,
								nature_mod,
								ST_X(geom::geometry) as x_long,
								ST_Y(geom::geometry) as y_lat,
								date_saisie ,
								contributeur from signalement_adresse where ST_".$p ." AND date_saisie> now()- interval '6 month' ORDER BY date_saisie DESC,idsignal DESC";
				
			 }
			 else {
			 if(stristr($p,("between")))
			 {
			 $tab=split(" ",$p);
			 $p=$tab[0].' '.$tab[1].' '. "'".$tab[2]."'".' '.$tab[3]." "."'".$tab[4]."'";
			 $sql="Select  idsignal,
								depco ,
								libco ,
								type_ref ,
								nature_ref ,
								nature_mod,
								acte_ref ,
								comment_ref ,
								mel ,
								url_1 ,
								url_2 ,
								ST_X(geom::geometry) as x_long,
								ST_Y(geom::geometry) as y_lat,
								date_saisie ,
								contributeur from signalement_adresse where " .$p." AND  date_saisie> now()- interval '6 month' ORDER BY date_saisie DESC,idsignal DESC" ;
			}
			 
			 
			else { 
			
			 $sql="Select  idsignal,
								depco ,
								libco ,
								type_ref ,
								nature_ref ,
								nature_mod,
								acte_ref ,
								comment_ref ,
								mel ,
								url_1 ,
								url_2 ,
								ST_X(geom::geometry) as x_long,
								ST_Y(geom::geometry) as y_lat,
								date_saisie ,
								contributeur from signalement_adresse where " .$p." AND  date_saisie> now()- interval '6 month' ORDER BY date_saisie DESC,idsignal DESC" ;
								
								
			 }
			 
			 }
			 }
			 else {
				$sql = "Select idsignal,
								depco ,
								libco ,
								type_ref ,
								nature_ref ,
								acte_ref ,
								comment_ref ,
								nature_mod,
								mel ,
								url_1 ,
								url_2 ,
								ST_X(geom::geometry) as x_long,
								ST_Y(geom::geometry) as y_lat,
								date_saisie ,
								contributeur 
  from  signalement_adresse where date_saisie> now()- interval '6 month' ORDER BY date_saisie DESC,idsignal DESC" ;
				 }
				 $result = pg_query($dbh, $sql); 
				  if (!$result) {
				  echo("sql=".$sql);
					 pg_query($dbh,"rollback");
					 echo '{success:false, message:'.json_encode("erreur dans le traitement de : " .$nomDestination).'}';
					 die();
				 }
				
				
				
				
				
$xml_output = '<?xml version="1.0" encoding="utf-8"?>';
$xml_output .= '<rss version="2.0" 
  xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"
  xmlns:atom="http://www.w3.org/2005/Atom"   
  xmlns:dc="http://purl.org/dc/elements/1.1/">';

$xml_output .= '<channel><atom:link href="http://kartenn.region-bretagne.fr/ws/rss/rss.php" rel="self" type="application/rss+xml" />';
$xml_output .= '<title>SIGN\'ADRESSE</title>
 <description> La couche Signalement voies adresses en Bretagne recense les ajouts, suppressions et modifications opérés sur les voies et adresses en Bretagne</description>
 
 <dc:publisher>SIG REGION</dc:publisher>
 <lastBuildDate>'.date(DATE_RFC2822).'</lastBuildDate>
 <link>http://dev.geobretagne.fr/signalement/</link>
 <ttl>01</ttl>';
	



 for ($i=0; $i<pg_numrows($result); $i++) {
      
	  $l=pg_fetch_array($result,$i);
	  $titre=$l["idsignal"];
	  $description=$l["comment_ref"];
	  $date=$l["date_saisie"];
	  $date2=date("D, d M Y H:i:s", strtotime($date));
	  $contributeur=$l["contributeur"];
	  $commune=$l["libco"];
	
	  $nature=$l["nature_ref"];
	  $nature_mod=$l["nature_mod"];
	  $mel=$l["mel"];
	  $author = str_replace ( '@', '[AT]', $mel) ;
	  $autheur_nom=substr($mel,stripos($mel,'@'));
	  $x_min=$l["x_long"] -152.5;
	  $y_min=$l["y_lat"] -152.5;
	  $x_max=$l["x_long"] +152.5;
	  $y_max=$l["y_lat"] +152.5;
	  $url1=$l["url_1"];
	  $url2=$l["url_2"];
	  $url_vign="http://osm.geobretagne.fr/gwc01/service/wms?LAYERS=osm%3Agoogle&VERSION=1.1.1&FORMAT=image%2Fpng&SERVICE=WMS&REQUEST=GetMap&STYLES=&SRS=EPSG%3A2154&BBOX=".$x_min.",".$y_min.",".$x_max.",".$y_max."&WIDTH=256&HEIGHT=256";
	
	
	
	  $urlimg1="http://kartenn.region-bretagne.fr/ws/attach.png";
	  $ur1="";
	  $ur2="";
	  if(substr_count($url1, "http")>=1){
	  $ur1=	'<li><strong>Pièce Jointe n°1: </strong><a href='.$url1.' ><img src='.$urlimg1.' style="width:29px;"></a> </li>';
	  }
	  
	  if(substr_count($url2, "http")>=1){
	  $ur2='<li><strong>Pièce Jointe n°2: </strong><a href='.$url2.' ><img src='.$urlimg1.' style="width:29px;"></a> </li>';
	}
	
	 $link="http://kartenn.region-bretagne.fr/sviewer/?x=".$l["x_long"]."&y=".$l["y_lat"]."&z=17&bl=0&layers=edit_rb%3Asignalement_adresse*Signalement&title=SIGN\'ADRESSE&amp;i=1 ";
	  
      $xml_output .='<item>';
	  $xml_output .='<guid isPermaLink="false">signalement'.$titre.'</guid>';
	 $xml_output .='<link> http://kartenn.region-bretagne.fr/sviewer/?x='.$l["x_long"].'&amp;y='.$l["y_lat"].'&amp;z=17&amp;bl=0&amp;layers=edit_rb%3Asignalement_adresse*Signalement&amp;title=SIGN\'ADRESSE&amp;i=1 </link>';
      $xml_output .= '<title>Signalement n°'.$titre.'</title>';
	  $xml_output.= '<pubDate>'.$date2.' GMT </pubDate>'; 
	
	  $xml_output.='<author>'.$author.' ('.$autheur_nom.')</author>';
	//$xml_output.='<link>'.$url1.'</link>';
	  //$xml_output.='<enclosure url="'..'" type="text/html" />';
	  if (isset($_GET["map"])) {
			 $mp=$_GET["map"];
			 
	  $xml_output .= '<description><![CDATA[<table><tr>
			<td>
			<ul>
			<li><strong>Commune: </strong>'.$commune.'</li>
			<li><strong>Nature du signalement: </strong>'.$nature.'</li>';
	if(stristr($nature,("modification")))
	{
	$xml_output .='<li><strong>Nature de la modification: </strong>'.$nature_mod.'</li>';
		
	
	}
	  $xml_output .=
			'<li><strong>Commentaire: </strong>'.$description.'</li>
			<li><strong>Type de Contributeur: </strong>'.$contributeur.'</li>
			<li><strong>Auteur: </strong>'.str_replace ( '[AT]', '<img src="http://kartenn.region-bretagne.fr/img/logos/separateur.jpg">', $author).'</li>'. $ur1. $ur2.'
			</td><td></ul><a href='.$link.' ><img src='.$url_vign.' style="width:100px;"></a></td></tr></table>]]>'.'</description>';
	 }
	 else 
	 {
	 
	 
	 	  $xml_output .= '<description><![CDATA[<table><tr>
			<td>
			<ul>
			<li><strong>Commune: </strong>'.$commune.'</li>
			<li><strong>Nature du signalement: </strong>'.$nature.'</li>';
		if(stristr($nature,("modification")))
	{
	$xml_output .='<li><strong>Nature de la modification: </strong>'.$nature_mod.'</li>';
		
	
	}
			
		  $xml_output .='<li><strong>Commentaire: </strong>'.$description.'</li>
			<li><strong>Type de Contributeur: </strong>'.$contributeur.'</li>
			<li><strong>Auteur: </strong>'.str_replace ( '[AT]', '<img src="http://kartenn.region-bretagne.fr/img/logos/separateur.jpg">', $author).'</li>'. $ur1. $ur2.'
			</td></ul></tr></table>]]>'.'</description>';
	 
	 
	 }
	 
	  $xml_output .= '</item>';	
$url1=NULL;
    }
$xml_output .= '</channel>';
$xml_output .= '</rss>';
print $xml_output;
	pg_close($dbh);
fclose($fp);
}

?>
