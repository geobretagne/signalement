<?php
/* for security the database password is in another file behind the firewall
You must include it for the connection
*/
include_once("../secret/signalement.php");
date_default_timezone_set('Europe/Paris');
header('Content-Type: application/rss+xml; charset=UTF-8');
error_reporting(-1);
$dbh=pg_connect($pg_connect_);

if (!$dbh) {
	echo '{success:false, message:'.json_encode("Connexion à la Base Impossible").'}';	 		 
	die();
	}

/* In the SIGN'ADRESSE application you have 4 requests and 1 option 
*The requests are :
*You can subcribe rss on :
* Departement reporting
* Town intersected
* Polygon
* All reporting in DataBase 
* And this with an option on the number of attachments
*/
$urlcql="";
if (isset($_GET["cql_url"]))
{
	$nbr=$_GET["cql_url"];
	if($nbr==1){
		$urlcql="(SUBSTRING(url_1 FROM 1 FOR 4)='http' OR SUBSTRING(url_2 FROM 1 FOR 4)='http') AND ";
	}
	if($nbr==2){
		$urlcql="(SUBSTRING(url_1 FROM 1 FOR 4)='http' AND SUBSTRING(url_2 FROM 1 FOR 4)='http') AND ";
	}
	

}
 if (isset($_GET["cql_filter"])) {
	$p=$_GET["cql_filter"];
	if(stristr($p,"intersect")) {
		$p=str_replace(")))","))',2154))",$p);
		$p=str_replace("POLYGON","GeomFromText('POLYGON",$p);		
		$sql="Select idsignal,
						depco,
						libco,
						type_ref,
						nature_ref,
						acte_ref,
						comment_ref,
						mel,
						url_1,
						url_2,
						nature_mod,
						ST_X(ST_Transform(geom::geometry,3857)) as x_long,
						ST_Y(ST_Transform(geom::geometry,3857)) as y_lat,
						date_saisie,
						contributeur from a_05_adresses.signalement_adresse where ".$urlcql." ST_".$p." AND date_saisie> now()- interval '6 month' ORDER BY date_saisie DESC,idsignal DESC";
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
								ST_X(ST_Transform(geom::geometry,3857)) as x_long,
								ST_Y(ST_Transform(geom::geometry,3857)) as y_lat,
								date_saisie ,
								contributeur from a_05_adresses.signalement_adresse where " .$urlcql.$p." AND  date_saisie> now()- interval '6 month' ORDER BY date_saisie DESC,idsignal DESC" ;
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
								ST_X(ST_Transform(geom::geometry,3857)) as x_long,
								ST_Y(ST_Transform(geom::geometry,3857)) as y_lat,
								date_saisie ,
								contributeur from a_05_adresses.signalement_adresse where ".$urlcql.$p." AND  date_saisie> now()- interval '6 month' ORDER BY date_saisie DESC,idsignal DESC" ;					
			 }}}
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
						ST_X(ST_Transform(geom::geometry,3857)) as x_long,
						ST_Y(ST_Transform(geom::geometry,3857)) as y_lat,
						date_saisie ,
						contributeur 
 			from  a_05_adresses.signalement_adresse where ".$urlcql."date_saisie> now()- interval '6 month' ORDER BY date_saisie DESC,idsignal DESC" ;
	}
$result = pg_query($dbh, $sql); 
if (!$result) {
	echo("sql=".$sql);
	pg_query($dbh,"rollback");
	echo '{success:false, message:'.json_encode("erreur SQL").'}';
	die();
	 }
				
				
				
/*Development of RSS *
*RSS is making with XML File * 
*You can read the documentation in this website : http://www.rssboard.org/ *
*/			
$xml_output = '<?xml version="1.0" encoding="utf-8"?>';
$xml_output .= '<rss version="2.0" 
  xmlns:geo="http://www.w3.org/2003/01/geo/wgs84_pos#"
  xmlns:atom="http://www.w3.org/2005/Atom"   
  xmlns:dc="http://purl.org/dc/elements/1.1/">';

$xml_output .= '<channel><atom:link href="http://kartenn.region-bretagne.fr/signalement/ws/rss.php" rel="self" type="application/rss+xml" />';
$xml_output .= '<title>SIGN\'ADRESSE</title>
 <description> La couche Signalement voies adresses en Bretagne recense les ajouts, suppressions et modifications opérés sur les voies et adresses en Bretagne</description>
 
 <dc:publisher>SIG REGION</dc:publisher>
 <lastBuildDate>'.date(DATE_RFC2822).'</lastBuildDate>
 <link>http://dev.geobretagne.fr/signalement/</link>
 <ttl>01</ttl>';	
/* 
treatment of the SQL request Result 
*Foreach element construction of an RSS item with 
*Titre: id of reporting
*Description: Description of this reporting
*Date : Date when this repoting was entered in the database
*Date2 : Date with a good form
*Commune : City reporting
*Nature : Nature of the reporting
*Nature_mod : Nature of the modification ( if the nature of the reporting is modification)
*Mel : Mail author
*Author : Mail with replacement of @
*X_(min/max) & Y_(min/max) : coordinate for the reporting
*/
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
	  $urlimg1="http://kartenn.region-bretagne.fr/ws/attach.png";
	  $ur1="";
	  $ur2="";
	  if(substr_count($url1, "http")>=1){
	  	$ur1=	'<li><strong>Pièce Jointe n°1: </strong><a href='.$url1.' ><img src='.$urlimg1.' style="width:29px;"></a> </li>';
	  }
	  
	  if(substr_count($url2, "http")>=1){
	  	$ur2='<li><strong>Pièce Jointe n°2: </strong><a href='.$url2.' ><img src='.$urlimg1.' style="width:29px;"></a> </li>';
	}
	
	  $link="http://kartenn.region-bretagne.fr/sviewer/?x=".$l["x_long"]."&y=".$l["y_lat"]."&z=17&bl=0&layers=edit_rb%3Asignalement_adresse*signalement&title=SIGN\'ADRESSE&amp;q=1 ";
	  
      $xml_output .='<item>';
	  $xml_output .='<guid isPermaLink="false">signalement'.$titre.'</guid>';
	  $xml_output .='<link> http://kartenn.region-bretagne.fr/sviewer/?x='.$l["x_long"].'&amp;y='.$l["y_lat"].'&amp;z=17&amp;bl=0&amp;layers=edit_rb%3Asignalement_adresse*signalement&amp;title=SIGN\'ADRESSE&amp;q=1 </link>';
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
    $xml_output.='</channel>
    </rss>';
print $xml_output;
	pg_close($dbh);
?>
