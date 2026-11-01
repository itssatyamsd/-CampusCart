
import java.io.*;
import java.sql.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;

public class OrderServlet extends HttpServlet {

    protected void doPost(HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("text/plain;charset=UTF-8");

        String location = request.getParameter("location");
        String items = request.getParameter("items");

        if (location == null || location.trim().isEmpty()
                || location.length() > 100
                || items == null || items.trim().isEmpty()) {
            response.setStatus(400);
            response.getWriter().print("Invalid order details.");
            return;
        }

        String[] itemList = items.split(",");
        int userId = 1;
        double total = 0;

        try (Connection con = DBConnection.getConnection()) {

            con.setAutoCommit(false);

            try {
                String sql = "INSERT INTO orders " +
                        "(user_id,total_amount,delivery_location,payment_method) " +
                        "VALUES (?,0,?,'Cash')";

                int orderId;

                try (PreparedStatement ps = con.prepareStatement(
                        sql, Statement.RETURN_GENERATED_KEYS)) {

                    ps.setInt(1, userId);
                    ps.setString(2, location.trim());
                    ps.executeUpdate();

                    try (ResultSet keys = ps.getGeneratedKeys()) {
                        if (!keys.next()) {
                            throw new SQLException("Order ID not generated.");
                        }
                        orderId = keys.getInt(1);
                    }
                }

                for (String item : itemList) {

                    String[] data = item.trim().split(":");

                    if (data.length != 2) {
                        throw new IllegalArgumentException("Invalid item format.");
                    }

                    String name = data[0].trim();
                    int quantity = Integer.parseInt(data[1].trim());

                    if (name.isEmpty() || quantity <= 0) {
                        throw new IllegalArgumentException("Invalid food item or quantity.");
                    }

                    String findSql = "SELECT food_id,price FROM food_items WHERE food_name=?";

                    try (PreparedStatement find = con.prepareStatement(findSql)) {

                        find.setString(1, name);

                        try (ResultSet rs = find.executeQuery()) {

                            if (!rs.next()) {
                                throw new SQLException("Food item not found: " + name);
                            }

                            int foodId = rs.getInt("food_id");
                            double price = rs.getDouble("price");

                            total += price * quantity;

                            String addSql = "INSERT INTO order_items " +
                                    "(order_id,food_id,quantity,item_price) VALUES (?,?,?,?)";

                            try (PreparedStatement add = con.prepareStatement(addSql)) {
                                add.setInt(1, orderId);
                                add.setInt(2, foodId);
                                add.setInt(3, quantity);
                                add.setDouble(4, price);
                                add.executeUpdate();
                            }
                        }
                    }
                }

                try (PreparedStatement update = con.prepareStatement(
                        "UPDATE orders SET total_amount=? WHERE order_id=?")) {

                    update.setDouble(1, total);
                    update.setInt(2, orderId);
                    update.executeUpdate();
                }

                con.commit();

                response.getWriter().print(
                        "Order placed successfully! Order ID: " + orderId);

            } catch (Exception e) {
                con.rollback();
                throw e;
            }

        } catch (Exception e) {
            response.setStatus(500);
            response.getWriter().print("Order failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
