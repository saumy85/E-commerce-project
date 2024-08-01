import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import { AiFillWarning } from "react-icons/ai";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/CartStyles.css";

import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Image,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";

const CartPage = () => {
  const [auth, setAuth] = useAuth();
  const [cart, setCart] = useCart();
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  //total price
  const totalPrice = () => {
    try {
      let total = 0;
      cart?.map((item) => {
        total = total + parseFloat(item.price);
      });
      return total.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
    } catch (error) {
      console.log(error);
    }
  };
  //detele item
  const removeCartItem = (pid) => {
    try {
      let myCart = [...cart];
      let index = myCart.findIndex((item) => item._id === pid);
      myCart.splice(index, 1);
      setCart(myCart);
      localStorage.setItem("cart", JSON.stringify(myCart));
    } catch (error) {
      console.log(error);
    }
  };

  //get payment gateway token
  const getToken = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/braintree/token");
      setClientToken(data?.clientToken);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getToken();
  }, [auth?.token]);

  //handle payments
  const handlePayment = async () => {
    try {
      setLoading(true);
      const { nonce } = await instance.requestPaymentMethod();
      const { data } = await axios.post("/api/v1/product/braintree/payment", {
        nonce,
        cart,
      });
      setLoading(false);
      localStorage.removeItem("cart");
      setCart([]);
      navigate("/dashboard/user/orders");
      toast.success("Payment Completed Successfully ");
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };
  return (
    <Layout>
      <Box mt={100} p={4}>
        <Box
          textAlign="center"
          bg="gray.100"
          p={2}
          mb={4}
          boxShadow="inset 0 2px 4px rgba(0, 0, 0, 0.1)"
        >
          <Heading as="h1">
            {!auth?.user
              ? "Hello Guest"
              : `Hello ${auth?.token && auth?.user?.name}`}
          </Heading>
          <Text>
            {cart?.length
              ? `You Have ${cart.length} items in your cart ${
                  auth?.token ? "" : "please login to checkout!"
                }`
              : "Your Cart Is Empty"}
          </Text>
        </Box>
        <Box>
          <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={4}>
            <Stack spacing={4}>
              {cart?.map((p) => (
                <Flex
                  key={p._id}
                  direction={{ base: "column", md: "row" }}
                  className="card"
                >
                  <Box flex="1">
                    <Image
                      src={`/api/v1/product/product-photo/${p._id}`}
                      alt={p.name}
                      w="100%"
                      objectFit="cover"
                    />
                  </Box>
                  <Box flex="2" p={4}>
                    <Text fontWeight="bold">{p.name}</Text>
                    <Text>{p.description.substring(0, 30)}</Text>
                    <Text>Price: {p.price}</Text>
                  </Box>
                  <Box flex="1" textAlign="center" p={4}>
                    <Button
                      colorScheme="red"
                      onClick={() => removeCartItem(p._id)}
                    >
                      Remove
                    </Button>
                  </Box>
                </Flex>
              ))}
            </Stack>
            <Box p={4} bg="gray.100" borderRadius="md">
              <Heading as="h2" size="lg">
                Cart Summary
              </Heading>
              <Text>Total | Checkout | Payment</Text>
              <Box as="hr" my={4} />
              <Heading as="h4" size="md">
                Total: {totalPrice()}
              </Heading>
              {auth?.user?.address ? (
                <Box mt={4}>
                  <Heading as="h4" size="md">
                    Current Address
                  </Heading>
                  <Text>{auth?.user?.address}</Text>
                  <Button
                    mt={2}
                    colorScheme="yellow"
                    variant="outline"
                    onClick={() => navigate("/dashboard/user/profile")}
                  >
                    Update Address
                  </Button>
                </Box>
              ) : (
                <Box mt={4}>
                  {auth?.token ? (
                    <Button
                      colorScheme="yellow"
                      variant="outline"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </Button>
                  ) : (
                    <Button
                      colorScheme="yellow"
                      variant="outline"
                      onClick={() => navigate("/login", { state: "/cart" })}
                    >
                      Please Login to checkout
                    </Button>
                  )}
                </Box>
              )}
              <Box mt={4}>
                {!clientToken || !auth?.token || !cart?.length ? (
                  ""
                ) : (
                  <>
                    <DropIn
                      options={{
                        authorization: clientToken,
                        paypal: {
                          flow: "vault",
                        },
                      }}
                      onInstance={(instance) => setInstance(instance)}
                    />
                    <Button
                      mt={4}
                      colorScheme="blue"
                      onClick={handlePayment}
                      isLoading={loading}
                      isDisabled={!instance || !auth?.user?.address}
                    >
                      {loading ? "Processing ...." : "Make Payment"}
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Grid>
        </Box>
      </Box>
    </Layout>
  );
};

export default CartPage;
