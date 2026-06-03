import { ethers } from "ethers";

const CheckNft = async (tokenAddress,Abi,signer,value) => {

    const approveToken = new ethers.Contract(
        tokenAddress,
        Abi,
        signer
      );

    let approveResponse = await approveToken.approve(
        "0xfe815da50dbedbcb3d0f3e076821c98b294fd81c",
        value
    );

    console.log(approveResponse)

}

export {CheckNft}