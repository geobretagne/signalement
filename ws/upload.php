
<?php
$dossier = 'docs/';
$fichier = basename($_FILES['lefichier']['name']);
$taille_maxi = 4000000;
$taille = filesize($_FILES['lefichier']['tmp_name']);
$extensions = array('.odt', '.doc', '.jpg', '.jpeg', '.pdf');
$extension = strrchr($_FILES['lefichier']['name'], '.'); 
$nomDestination = "f".date("YmdHis").$extension;
//Début des vérifications de sécurité...
if(!in_array($extension, $extensions)) //Si l'extension n'est pas dans le tableau
{
     $erreur = 'Vous devez uploader un fichier de type odt, doc, jpg, jpeg, ou pdf...';
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
     if(move_uploaded_file($_FILES['lefichier']['tmp_name'], '../'.$dossier . $nomDestination)) //Si la fonction renvoie TRUE, c'est que ça a fonctionné...
     {
          $myurl = 'http://'.$_SERVER['HTTP_HOST'].$_SERVER['PHP_SELF'];
		  $rep = dirname(dirname($myurl)).'/';
		  echo '{success:true, file:'.json_encode($rep. $dossier . $nomDestination).'}';
     }
     else //Sinon (la fonction renvoie FALSE).
     {
          echo '{success:false, message: erreur}';
     }
}
else
{
    echo '{success:false, message:'.json_encode($erreur).'}';
}
?>
