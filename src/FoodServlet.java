
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class FoodServlet extends HttpServlet {

    protected void doGet(HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();

        String sql = "SELECT food_name, description, price FROM food_items WHERE is_available = TRUE";

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");

            try (Connection con = DBConnection.getConnection();
                    PreparedStatement ps = con.prepareStatement(sql);
                    ResultSet rs = ps.executeQuery()) {

                out.print("[");
                boolean first = true;

                while (rs.next()) {
                    if (!first)
                        out.print(",");
                    first = false;

                    out.print("{\"name\":\"" +
                            rs.getString("food_name").replace("\"", "\\\"") +
                            "\",\"description\":\"" +
                            rs.getString("description").replace("\"", "\\\"") +
                            "\",\"price\":" +
                            rs.getBigDecimal("price") + "}");
                }

                out.print("]");
            }

        } catch (Exception e) {
            response.setStatus(500);
            out.print("{\"error\":\"Unable to load food menu\"}");
            getServletContext().log("FoodServlet database error:", e);
        }
    }
}
