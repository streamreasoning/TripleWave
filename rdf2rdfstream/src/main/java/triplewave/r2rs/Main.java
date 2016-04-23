package triplewave.r2rs;

import java.nio.file.Paths;

import org.apache.jena.atlas.lib.FileOps;
import org.apache.jena.fuseki.jetty.JettyFuseki;
import org.apache.jena.fuseki.server.FusekiEnv;
import org.apache.jena.fuseki.server.FusekiServer;
import org.apache.jena.fuseki.server.FusekiServerListener;
import org.apache.jena.fuseki.server.ServerInitialConfig;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.sparql.engine.binding.Binding;
import org.apache.jena.sparql.util.QueryExecUtils;
import org.apache.jena.update.UpdateExecutionFactory;
import org.apache.jena.update.UpdateProcessor;

public class Main {
	public static void main(String[] args) {
//		  System.setProperty("FUSEKI_HOME", "/home/afs/Jena/jena-fuseki2/jena-fuseki-core") ;
//		  String fusekiBase = "/home/afs/tmp/run" ;
//		  System.setProperty("FUSEKI_BASE", fusekiBase) ;
//		  String runArea = Paths.get(fusekiBase).toAbsolutePath().toString() ;
//		  FileOps.ensureDir(runArea) ;
//		  FusekiCmd.main(
//		              //"--conf=/home/afs/tmp/config.ttl"
//		              "--update", "--loc=DB",  "/ds"
//		              "--set=tdb:unionDefaultGraph=true", "/ds"
//		            ) ; 		
//		
//		    ServerInitialConfig serverSetup = new ServerInitialConfig() ;
//
//		    FusekiServerListener.initialSetup = serverSetup ;
//		    JettyFuseki.initializeServer(jettyServerConfig) ;
//		    JettyFuseki.instance.start() ; 
		
	}
	
	public void triplesToRdfStream(String file, int keys, String keyGraphPattern, String inputEventGraphPattern, String outputEventGraphPattern, String timeGraphPattern){
		Model input = RDFDataMgr.loadModel(file);
		
		String projected = ""; 
		for(int i=1; i<=keys; i++){
			projected+="k"+i+" ";
		}
		String keyExtraction = 
				"SELECT "
				+ projected
				+ " WHERE {"+keyGraphPattern+"}";
		
		//combination of the keys to compute the graph names
		String graphName = "";
		
		QueryExecution qe = QueryExecutionFactory.create(keyExtraction, input);

		ResultSet rs = qe.execSelect();
		
		String transformationQuery = 
				"CONSTRUCT {"
				+ "GRAPH "+graphName+"{"+outputEventGraphPattern+"} "
				+ graphName+" :hasTs ?ts "
				+ "} WHERE { "
				+ inputEventGraphPattern 
				+ timeGraphPattern 
				+ "}";
		
		String insertQuery = 
				"INSERT {"
				+ "GRAPH "+graphName+"{"+outputEventGraphPattern+"} "
				+ graphName+" :hasTs ?ts "
				+ "} WHERE { "
				+ "GRAPH "+input +" { "
				+ inputEventGraphPattern 
				+ timeGraphPattern 
				+ "}}";
		
		while(rs.hasNext()){
			Binding b = rs.nextBinding();
			QueryExecution qe2 = QueryExecutionFactory.create(transformationQuery, input);
			UpdateProcessor ue = UpdateExecutionFactory.create(insertQuery, null);
			ue.execute();			
		}
		
	}
		
	
}
