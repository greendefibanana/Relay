import { BsIncognito } from "react-icons/bs";
import { BiInfoCircle } from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import { IoMdMenu } from "react-icons/io";
import {
  EditableSuccessModal,
  ErrorModal,
  ErrorModal2,
  ErrorSlideModal,
  SelectTokenBdrop,
  SliderModal,
  SuccessModal,
} from "../components/backDropComponent";
import { useState } from "react";
import { useContext } from "react";
import AppContext from "../context/Appcontext";
import { ethers } from "ethers";
import { ERC20ABI, ERC721, abi, abi2 } from "../constants/abi";
import { Spinner } from "@nextui-org/react";
// import { useWeb3Contract } from 'react-moralis';

const SetuptradeDapp = ({ closeHeader }) => {
  const navigate = useNavigate();

  const [openModal, setopenModal] = useState(false);
  const [openMessage, setopenMessage] = useState(false);
  const {
    enableWeb3,
    displayAccount,
    signer,
    user_account,
    walletProvider,
    TradeFactorycontractAddress,
    MainControllercontractAddress,
  } = useContext(AppContext);
  const [PrivateTrade, setPrivateTrade] = useState(false);

  const [tokenToswap, settokenToswap] = useState(null);
  const [tokenToreceive, settokenToreceive] = useState(null);
  const [tokenToOpen, settokenToOpen] = useState(false);
  const [amountTokenToSwap, setamountTokenToSwap] = useState("0");
  const [amountTokenToReceive, setamountTokenToReceive] = useState("0");

  const [isLoading, setisLoading] = useState(false);
  const [displayError, setdisplayError] = useState(false);
  const [errorMessage, seterrorMessage] = useState("");
  const [recepientWalletAddress, setrecepientWalletAddress] = useState("");
  const [TradeCreated, setTradeCreated] = useState(false);

  const HandleCreateTrade = async () => {
    setisLoading(true);

    if (!user_account) {
      setdisplayError(true);
      seterrorMessage("Please connect your wallet");
      setisLoading(false);
      return;
    }

    if (!tokenToswap || !tokenToreceive) {
      setdisplayError(true);
      seterrorMessage("Please fill all fields");
      setisLoading(false);
      return;
    }

    if (PrivateTrade && recepientWalletAddress === "") {
      setdisplayError(true);
      seterrorMessage("Please fill all fields");
      setisLoading(false);
      return;
    }

    let recepientAddress = recepientWalletAddress.toLowerCase();
    let userAddress = user_account.toLowerCase();

    if (recepientAddress === userAddress) {
      setdisplayError(true);
      seterrorMessage("You cannot be the recepiant of your own trade");
      setisLoading(false);
      return;
    }

    try {
      const contract = new ethers.Contract(
        TradeFactorycontractAddress,
        abi,
        signer
      );

      var params;

      var owner2 = PrivateTrade
        ? recepientWalletAddress
        : "0x0000000000000000000000000000000000000000";

      var count = parseInt(amountTokenToReceive, 10);
      count = count * 1000000;

      var count2 = parseInt(amountTokenToSwap, 10);
      count2 = count2 * 1000000;

      if (
        tokenToreceive.name === "Ethereum" &&
        tokenToswap.name !== "Ethereum"
      ) {
        if (tokenToswap.TradeId !== null) {
          // console.log("gothere_");

          params = {
            owner2: owner2,
            eth: [
              {
                from: owner2,
                to: user_account,
                count: count,
              },
            ],
            erc20: [],
            erc721Item: [
              {
                from: user_account,
                to: owner2,
                token: tokenToswap.tokenAddress,
                tokenId: parseInt(tokenToswap.tokenId, 10),
              },
            ],
            erc721Count: [],
          };
        } else {
          params = {
            owner2: owner2,
            eth: [
              {
                from: owner2,
                to: user_account,
                count: count,
              },
            ],
            erc20: [
              {
                from: user_account,
                to: owner2,
                token: tokenToswap.tokenAddress,
                count: count2,
              },
            ],
            erc721Item: [],
            erc721Count: [],
          };
        }
      }

      if (
        tokenToreceive.name !== "Ethereum" &&
        tokenToswap.name === "Ethereum"
      ) {
        // console.log("gothere_");

        if (tokenToreceive.tokenId !== null) {
          // console.log("gothere_");

          params = {
            owner2: owner2,
            erc721Item: [
              {
                from: owner2,
                to: user_account,
                token: tokenToreceive.tokenAddress,
                tokenId: parseInt(tokenToreceive.tokenId, 10),
              },
            ],
            erc721Count: [],
            erc20: [],
            eth: [
              {
                from: user_account,
                to: owner2,
                count: count2,
              },
            ],
          };
        }

        if (tokenToreceive.tokenId == null) {
          // console.log("gothere_");

          params = {
            owner2: owner2,
            erc20: [
              {
                from: owner2,
                to: user_account,
                token: tokenToreceive.tokenAddress,
                count: count,
              },
            ],
            eth: [
              {
                from: user_account,
                to: owner2,
                count: count2,
              },
            ],
            erc721Item: [],
            erc721Count: [],
          };
        }
      }

      if (
        tokenToreceive.name !== "Ethereum" &&
        tokenToswap.name !== "Ethereum"
      ) {
        if (tokenToreceive.tokenId !== null && tokenToswap.tokenId === null) {
          // console.log("gothere_");

          params = {
            owner2: owner2,
            erc721Item: [
              {
                from: owner2,
                to: user_account,
                token: tokenToreceive.tokenAddress,
                tokenId: parseInt(tokenToreceive.tokenId),
              },
            ],
            erc721Count: [],
            eth: [],
            erc20: [
              {
                from: user_account,
                to: owner2,
                count: count2,
                token: tokenToswap.tokenAddress,
              },
            ],
          };
        }

        if (tokenToreceive.tokenId === null && tokenToswap.tokenId !== null) {
          // console.log("dhdu");
          params = {
            owner2: owner2,
            eth: [],
            erc20: [
              {
                from: owner2,
                to: user_account,
                count: count,
                token: tokenToreceive.tokenAddress,
              },
            ],
            erc721Item: [
              {
                from: user_account,
                to: owner2,
                token: tokenToswap.tokenAddress,
                tokenId: parseInt(tokenToswap.tokenId),
              },
            ],
            erc721Count: [],
          };
        }

        if (tokenToreceive.tokenId !== null && tokenToswap.tokenId !== null) {
          params = {
            owner2: owner2,
            eth: [],
            erc20: [],
            erc721Item: [
              {
                from: owner2,
                to: user_account,
                token: tokenToreceive.tokenAddress,
                tokenId: parseInt(tokenToreceive.tokenId),
              },
              {
                from: user_account,
                to: owner2,
                token: tokenToswap.tokenAddress,
                tokenId: parseInt(tokenToswap.tokenId),
              },
            ],
            erc721Count: [],
          };
        }

        if (tokenToreceive.tokenId === null && tokenToswap.tokenId === null) {
          params = {
            owner2: owner2,
            eth: [],
            erc20: [
              {
                from: owner2,
                to: user_account,
                token: tokenToreceive.tokenAddress,
                count: count,
              },
              {
                from: user_account,
                to: owner2,
                token: tokenToswap.tokenAddress,
                count: count2,
              },
            ],
            erc721Item: [],
            erc721Count: [],
          };
        }
      }

      // const response = await contract.createTrade(
      //     {
      //         owner2: '0x0000000000000000000000000000000000000000',
      //         eth: [],
      //         erc20: [
      //           {
      //             from: '0x0000000000000000000000000000000000000000',
      //             to: user_account,
      //             token: '0x810756d3aE32b8c0446e5E107c4e797022940258',
      //             count: 90000000,
      //           }
      //         ],
      //         erc721Item: [{
      //           from: user_account,
      //           to: "0x0000000000000000000000000000000000000000",
      //           token: "0xB1A8e8b908F6c0c86052eA88892Bc7628a14B64A",
      //           tokenId: 34
      //         }],
      //         erc721Count: []
      //       }
      // )

      const response = await contract.createTrade(params);

      if (response.hash) {
        // count2  = count2 * 1000000

        let approveResponse;

        // console.log(tokenToswap.tokenId)

        if (tokenToswap.tokenId !== null) {

          var id = parseInt(tokenToswap.tokenId, 10);



          const Approve71Token = new ethers.Contract(
            tokenToswap.tokenAddress,
            ERC721,
            signer
          );

          approveResponse = await Approve71Token.approve(
            "0x86a04287dafc09b450bee2b5c99cee0b1ae20be7",
            id
          );
        } else {
          const ApproveToken = new ethers.Contract(
            tokenToswap.tokenAddress,
            ERC20ABI,
            signer
          );
          approveResponse = await ApproveToken.approve(
            "0xfe815da50dbedbcb3d0f3e076821c98b294fd81c",
            count2
          );
        }


        if (approveResponse) {
        }

        const ethersScanProvider = await walletProvider.getTransactionReceipt(
          response.hash
        );

        // console.log(ethersScanProvider);

        if (ethersScanProvider.logs[0].topics) {
          const hexToDecimal = (hex) => parseInt(hex, 16);
          let TradeId = hexToDecimal(ethersScanProvider.logs[0].topics[1]);
          // console.log(dec1)

          TradeId = parseInt(TradeId);

          const executecontract = new ethers.Contract(
            MainControllercontractAddress,
            abi2,
            signer
          );

          let executeresponse;

          // if ( tokenToswap.tokenId !== null ) {
          //     executeresponse = await.executecontract.createPoint
          // }

          executeresponse = await executecontract.execute(TradeId);

          console.log(executeresponse);

          if ( tokenToreceive.tokenId ) {
            
            var address3 = tokenToreceive.tokenAddress
            address3 = address3.toLowerCase()
      
            // console.log(address3);
      
      
            const submit2 = await fetch('http://localhost:5001/auth/add_nft',{
              method:"POST",
              headers:{
              "Content-Type": "application/json",
              },
              body: JSON.stringify({
                address:address3,
                name: "tokenToswap.name",
                symbol:"next"
              })
            })
      
            const response2 = await submit2.json()
            // console.log(response2)

          }

          if ( tokenToswap.tokenId ) {
            
              var address2 = tokenToswap.tokenAddress
              address2 = address2.toLowerCase()
        
              // console.log(address2);
        
        
              const submit2 = await fetch('http://localhost:5001/auth/add_nft',{
                method:"POST",
                headers:{
                "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  address:address2,
                  name: "tokenToswap.name",
                  symbol:"next"
                })
              })
        
              const response2 = await submit2.json()
              console.log(response2)

          }

          setTradeCreated(true);
          setisLoading(false);
          setamountTokenToReceive("0");
          setamountTokenToSwap("0");
          settokenToreceive(null);
          settokenToswap(null);
          setrecepientWalletAddress("");

          setTimeout(() => {
            navigate("/trades");
          }, 4000);

          return;
        } else {
          setisLoading(false);
          setdisplayError(true);
          seterrorMessage(
            "Something went wrong while processing your transaction"
          );
          return;
        }
      } else {
        setisLoading(false);
        setdisplayError(true);
        seterrorMessage(
          "Something went wrong while processing your transaction"
        );
        return;
      }
    } catch (error) {
      // console.log(error);
      setisLoading(false);
      setdisplayError(true);
      seterrorMessage("Something went wrong while processing your transaction");
      return;
    }
  };

  return (
    <div className="Otc_main">
      <div className="Otc_main_header">
        <h5>SETUP TRADE</h5>

        <div className="Otc_main_header_spc">
          <IoMdMenu
            className="Otc_main_header_spc_ic"
            style={{
              cursor: "pointer",
            }}
            onClick={closeHeader}
          />

          <Link className="Otc_main_header_spc_txt" to={"/trades"}>
            RELAY
          </Link>
        </div>

        <div className="Otc_main_header_right">
          <div className="Otc_main_header_right_wallet otc_tophdvgt">
            {displayAccount ? (
              <div className="Otc_main_header_right_wallet_center">
                {displayAccount}
              </div>
            ) : (
              <div
                className="Otc_main_header_right_wallet_center"
                style={{
                  cursor: "pointer",
                }}
                onClick={() => enableWeb3()}
              >
                Connect Wallet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="Otc_main_body">
        <div className="setupTrade">
          <div className="setupTrade_title">
            <h5>Set up a trade below</h5>

            <div className="setupTrade_title_right">
              <h6>Setting a private trade?</h6>
              <div
                className="setupTrade_title_right_switch"
                style={{
                  display: "flex",
                  justifyContent: PrivateTrade ? "flex-end" : "flex-start",
                  transition: "all .4s",
                }}
              >
                <div
                  className="setupTrade_title_right_switch_div"
                  style={{ transition: "all .4s" }}
                  onClick={() => setPrivateTrade(!PrivateTrade)}
                >
                  <BsIncognito color="#373739" />
                </div>
              </div>
            </div>
          </div>

          <div className="setupTrade_main">
            <h5>Wallet:</h5>
            <h6>{displayAccount ? displayAccount : ""}</h6>
          </div>

          <div className="setupTrade_main">
            <h5>Token to swap</h5>
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              {/* { tokenToswap ? <img src={tokenToswap.logo} alt="" style={{
                            width:'1.2rem',
                            display:"block",
                            marginRight:'.3rem'
                        }} /> : <></> } */}
              <h6
                onClick={() => {
                  setopenMessage(false);
                  settokenToOpen(false);
                  setopenModal(true);
                }}
              >
                {" "}
                {tokenToswap ? tokenToswap.name : "Select a token"}{" "}
              </h6>
            </div>
          </div>

          {tokenToswap ? (
            tokenToswap.tokenId !== null ? (
              <div className="setupTrade_main">
                <h5>Token Id:</h5>
                <input
                  type="text"
                  placeholder="0"
                  value={tokenToswap.tokenId}
                  onChange={(e) =>
                    settokenToswap({
                      ...tokenToswap,
                      tokenId: e.target.value,
                    })
                  }
                  style={{
                    textAlign: "right",
                  }}
                />
              </div>
            ) : (
              <div className="setupTrade_main">
                <h5>Amount of token to swap:</h5>
                <input
                  type="text"
                  placeholder="0"
                  value={amountTokenToSwap}
                  onChange={(e) => setamountTokenToSwap(e.target.value)}
                  style={{
                    textAlign: "right",
                  }}
                />
              </div>
            )
          ) : (
            <></>
          )}

          <div className="setupTrade_main">
            <h5>Token wanted in exchange:</h5>
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              {/* { tokenToreceive ? <img src={tokenToreceive.logo} alt="" style={{
                            width:'1.2rem',
                            display:"block",
                            marginRight:'.3rem'
                        }} /> : <></> } */}
              <h6
                onClick={() => {
                  setopenMessage(false);
                  settokenToOpen(true);
                  setopenModal(true);
                }}
              >
                {" "}
                {tokenToreceive ? tokenToreceive.name : "Select a token"}{" "}
              </h6>
            </div>
          </div>

          {tokenToreceive ? (
            tokenToreceive.tokenId !== null ? (
              <div className="setupTrade_main">
                <h5>Token Id:</h5>
                <input
                  type="text"
                  placeholder="0"
                  value={tokenToreceive.tokenId}
                  onChange={(e) =>
                    settokenToreceive({
                      ...tokenToreceive,
                      tokenId: e.target.value,
                    })
                  }
                  style={{
                    textAlign: "right",
                  }}
                />
              </div>
            ) : (
              <div className="setupTrade_main">
                <h5>Amount of token wanted in exchange:</h5>
                <input
                  type="text"
                  placeholder="0"
                  value={amountTokenToReceive}
                  onChange={(e) => setamountTokenToReceive(e.target.value)}
                  style={{
                    textAlign: "right",
                  }}
                />
              </div>
            )
          ) : (
            // <div className="setupTrade_main" >
            //     <h5>Amount of token wanted in exchange:</h5>
            //     <input type='text' placeholder='0' value={amountTokenToReceive} onChange={ (e) => setamountTokenToReceive(e.target.value) } style={{
            //         textAlign:"right"
            //     }} />
            // </div>

            <></>
          )}

          <div className="setupTrade_main">
            <h5>Performance tax</h5>
            <h6>1.5%</h6>
          </div>

          {PrivateTrade ? (
            <div className="setupTrade_main">
              <h5>Receipant Wallet Address:</h5>
              <input
                type="text"
                placeholder="0x000...000"
                value={recepientWalletAddress}
                onChange={(e) => setrecepientWalletAddress(e.target.value)}
                style={{
                  maxWidth: "40%",
                  display: "block",
                  textAlign: "right",
                  // border:"1px solid red"
                }}
              />
            </div>
          ) : (
            <></>
          )}

          <div className="setupTrade_list">
            <BiInfoCircle className="setupTrade_list_ic" />
            <h5>Default performance tax is 1.5% and is set by contract</h5>
          </div>

          <div className="setupTrade_main">
            <h5>Tax recipient</h5>
            <h6>0x0000...0000</h6>
          </div>

          <button
            className="setupTrade_btn"
            disabled={isLoading}
            onClick={() => {
              // setopenMessage(true)
              setopenModal(false);
              HandleCreateTrade();
            }}
          >
            {/*  */}
            {isLoading ? (
              <Spinner color="default" size="sm" />
            ) : (
              "Setup a Trade"
            )}
          </button>
        </div>
      </div>

      {openModal ? (
        <SelectTokenBdrop
          closeModal={(token) => {
            setopenModal(false);
            setopenMessage(false);
            if (token) {
              if (!tokenToOpen) {
                if (token === tokenToreceive) {
                  setdisplayError(true);
                  seterrorMessage("You cannot swap same token");
                } else {
                  settokenToswap(token);
                }
              } else {
                if (token === tokenToswap) {
                  setdisplayError(true);
                  seterrorMessage("You cannot swap same token");
                } else {
                  settokenToreceive(token);
                }
              }
            }
          }}
        />
      ) : (
        <></>
      )}

      {displayError ? (
        <ErrorModal2
          msg={errorMessage}
          closeModal={() => {
            setopenMessage(false);
            setopenModal(false);
            setdisplayError(false);
          }}
        />
      ) : (
        <></>
      )}

      {/* <ErrorSlideModal
                display={ displayError }
                error_msg={errorMessage}
                closeModal={ () => setdisplayError(false) }
            /> */}

      <SliderModal
        closeModal={() => setTradeCreated(false)}
        display={TradeCreated}
      />

      {TradeCreated ? (
        <EditableSuccessModal
          closeModal={() => setTradeCreated(false)}
          modal_message={"Your Trade was successfuly created"}
          modal_title={"Trade Created"}
        />
      ) : (
        <></>
      )}

      {/* <SuccessModal/> */}
    </div>
  );
};

export default SetuptradeDapp;

// {owner2: '0x0000000000000000000000000000000000000000',eth:[],erc20:[{from:"0x0000000000000000000000000000000000000000",to:"0x7d3Ac7EC7E4d942Af9Efd63ce19cF0d7C29f7b9e",token:"0x810756d3aE32b8c0446e5E107c4e797022940258",count:90000000}],erc721Item:[{from:"0x7d3Ac7EC7E4d942Af9Efd63ce19cF0d7C29f7b9e",to:"0x0000000000000000000000000000000000000000",token:"0xB1A8e8b908F6c0c86052eA88892Bc7628a14B64A",tokenId:23}],erc721Count:[]}
