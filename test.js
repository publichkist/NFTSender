import { Keypair, Connection, PublicKey, clusterApiUrl, sendAndConfirmTransaction, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { keypairIdentity, Metaplex, token } from '@metaplex-foundation/js';
import {readFileSync, promises as fsPromises} from 'fs';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as SPLToken from "@solana/spl-token";
import bs58 from 'bs58';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata, fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import dotenv from "dotenv"
dotenv.config()

// const secret = '';

// const secretKey = bs58.decode(secret);
// const wallet = Keypair.fromSecretKey(secretKey);
// console.log("PublicKey:", wallet.publicKey.toBase58())


// 👇️ if using ES6 Imports uncomment line below
// import {readFileSync, promises as fsPromises} from 'fs';
//const {promises: fsPromises} = require('fs');

// ✅ read file ASYNCHRONOUSLY
// async function asyncReadFile(filename) {
//   try {
//     const contents = await fsPromises.readFile(filename, 'utf-8');

//     const arr = contents.split(/\r?\n/);

//     console.log(arr); // 👉️ ['One', 'Two', 'Three', 'Four']

//     return arr;
//   } catch (err) {
//     console.log(err);
//   }
// }

//asyncReadFile('./private.txt');

await sendNft()

async function sendNft() {

    const contents = await fsPromises.readFile('./private.txt', 'utf-8'); //privates.txt
    const arr = contents.split(/\r?\n/);

    const contents1 = await fsPromises.readFile('./main.txt', 'utf-8'); //main.txt
    const arr1 = contents1.split(/\r?\n/);

    if (arr1.length == 0){
        console.log("Please input main wallet into main.txt");
        return;
    }

    if (arr.length == 0){
        console.log("Please input private keys into privates.txt");
        return;
    }

    const secretKey = bs58.decode(arr1[0]);
    const mainwallet = Keypair.fromSecretKey(secretKey);
    console.log("Main wallets PublicKey:", mainwallet.publicKey.toBase58())

    let solquant = 0;

    if (arr1.length == 2) {
        solquant = arr1[1];         
    }

    if (solquant.includes(',')){
        solquant = e.replace(',', ".");    
    }

    solquant = Number(solquant);

    arr.forEach((privatekey) => 
    {

      sendnfts2(privatekey, mainwallet, solquant);

    });
}

async function sendnfts2(privatekey, mainwallet, solquant){

    const secretKey = bs58.decode(privatekey);   
    const wallet = Keypair.fromSecretKey(secretKey);
    const connection = new Connection(clusterApiUrl('mainnet-beta'), "confirmed");
    const metaplex = new Metaplex(connection);
    metaplex.use(keypairIdentity(wallet));

   if (solquant > 0){
    const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: mainwallet.publicKey,
          toPubkey: wallet.publicKey,
          lamports: LAMPORTS_PER_SOL * solquant,
        }),
      );
    
      // Sign transaction, broadcast, and confirm
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [mainwallet],
      );
      console.log('SIGNATURE', signature);
   }

// }
//////////////////////////////////////////////////////////////////////////////////////////////
    const umi = createUmi('https://api.mainnet-beta.solana.com').use(mplTokenMetadata());
    

    if (!metaplex) {
        console.log('connection error')
    }
    console.log('get metaplex connection')


    let response = await connection.getTokenAccountsByOwner(
        new PublicKey(wallet.publicKey.toBase58()), // owner here
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );
        
     // const allNFTs = metaplex.nfts().findAllByOwner("");
    
    response.value.forEach((e) => {
        
        sendnfts3(connection, metaplex, wallet, e, umi, mainwallet);

    });

}

async function sendnfts3(connection, metaplex, wallet, e, umi, mainwallet)
{
    const accountInfo = SPLToken.AccountLayout.decode(e.account.data);
    const mint1 = new PublicKey(accountInfo.mint);
         
    const asset = await fetchDigitalAsset(umi, new PublicKey(mint1));
    
    if (!asset) {
        console.log("Error with getting asset from NFT with address" + mint1)
    }

    const txBuilder = metaplex.nfts().builders().transfer({
        nftOrSft: {address: new PublicKey(mint1), tokenStandard: asset.metadata.tokenStandard.value}, 
        fromOwner: new PublicKey(wallet.publicKey.toBase58()),
        toOwner: new PublicKey(mainwallet.publicKey.toBase58()), // wallet receiver from main.txt
        amount: token(1),
        authority: wallet 
    });
    if (!txBuilder) {
        console.log("didn't get txBuilder")
    }
    console.log('txBuilder get')

    const blockhash = connection.getLatestBlockhash(); // await
    if (!blockhash) {
        console.log("didn't get blockhash")
    }
    console.log('get blockhash', blockhash)

    try {
        const transaction = txBuilder.toTransaction(blockhash);

        const send = sendAndConfirmTransaction( // await
            connection,
            transaction,
            [wallet]
        );
        console.log('Transaction complete.', transaction);
    } catch (error) {
        console.error('Error:', error);
    }
}



// (async () => {
//     const transaction = new Transaction().add(
//         SystemProgram.transfer({
//           fromPubkey: wallet.publicKey,
//           toPubkey: new PublicKey('EQ29EeAM32zAJR6GStoyrnZHwRTiLWswrU83suMNHEZU'),
//           lamports: 0,
//         }),
//       );
    
//       // Sign transaction, broadcast, and confirm
//       const signature = await sendAndConfirmTransaction(
//         connection,
//         transaction,
//         [wallet],
//       );
//       console.log('SIGNATURE', signature);
// })()