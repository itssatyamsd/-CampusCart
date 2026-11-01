
import java.sql.Connection;
import java.sql.DriverManager;

public class DBConnection {

    private static final String URL = System.getenv("CAMPUSCART_DB_URL");

    private static final String USER = System.getenv("CAMPUSCART_DB_USER");

    private static final String PASSWORD = System.getenv("CAMPUSCART_DB_PASSWORD");

    public static Connection getConnection() throws Exception {

        Class.forName("com.mysql.cj.jdbc.Driver");

        if (URL == null || USER == null || PASSWORD == null) {
            throw new Exception("Database environment variables are missing.");
        }

        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
}
