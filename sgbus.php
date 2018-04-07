 <?php 
 	parse_str($_SERVER['QUERY_STRING']);
 	$sgbus_info = file_get_contents('https://arrivelah.herokuapp.com/?id=' . $id); 
  print_r($sgbus_info);
 ?> 
