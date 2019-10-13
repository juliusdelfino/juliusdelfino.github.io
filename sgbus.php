 <?php 
 	parse_str($_SERVER['QUERY_STRING']);
 	$sgbus_info = file_get_contents('https://sagabus.herokuapp.com/bus?id=' . $id);
  print_r($sgbus_info);
 ?> 
