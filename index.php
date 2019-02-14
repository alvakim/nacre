<?php
	$files = scandir('pages');
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>Nacre KB</title>
	<style>
		body{
			font-family:Verdana, Arial, Sans-Serif;
			background-color:#012;
			color:#ffe;
		}
		a:link{color:#efe}
		a:visited{color:#efe}
		a:hover{color:#0f0}
	</style>
</head>
<body>
	<h1>Nacre KB</h1>
	<?php
		foreach($files as $file){
			if($file=='..' || $file=='.') continue;
			echo('<li><a href="pages/'.$file.'">'.pathinfo($file)['filename'].'</a></li>');
		}
	?>
</body>
</html>
