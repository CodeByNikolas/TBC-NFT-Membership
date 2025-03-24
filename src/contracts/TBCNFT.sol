// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TBCNFT
 * @author TUM Blockchain Club (TBC)
 * @notice An ERC721 NFT contract for club membership tokens
 * @dev This contract was developed by TUM Blockchain Club for their membership NFTs
 * but can be freely used by other clubs or organizations for their own NFT collections.
 * @custom:website https://www.tum-blockchain.com/
 */

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TBCNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    string private _TBCbaseURI;

    /**
     * @dev Contract constructor initializes the NFT collection
     * @param name The name of the NFT collection
     * @param symbol The symbol of the NFT collection
     * @param initialOwner Address of the initial contract owner
     * @param baseURI Base URI for token metadata, used with token IDs to form full URIs
     */
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner,
        string memory baseURI
    ) ERC721(name, symbol) Ownable(initialOwner) {
        _tokenIds = 0;
        _TBCbaseURI = baseURI;
    }

    /**
     * @dev Returns the total number of tokens minted
     * @return The current number of minted tokens
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIds;
    }

    /**
     * @dev Mints a new NFT to the specified recipient
     * @param recipient Address of the recipient who will own the NFT
     * @param tokenURI Optional custom URI for this specific token's metadata
     * @return newItemId The ID of the newly minted NFT
     */
    function mintNFT(
        address recipient,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 newItemId = _tokenIds;

        _safeMint(recipient, newItemId);
        // only if tokenURI is not empty
        if (bytes(tokenURI).length > 0) _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    /**
     * @dev Mints multiple NFTs in sequence to a recipient
     * @param recipient Address receiving the NFTs
     * @param amount Number of NFTs to mint
     * @return firstTokenId ID of the first token minted in the batch
     */
    function batchMint(address recipient, uint256 amount) public onlyOwner returns (uint256) {
        require(amount > 0, "Amount must be greater than zero");
        
        uint256 firstTokenId = _tokenIds + 1;
        
        for (uint256 i = 0; i < amount; i++) {
            _tokenIds++;
            _safeMint(recipient, _tokenIds);
            // Uses the baseURI + tokenId automatically
        }
        
        return firstTokenId;
    }

    /**
     * @dev Sets custom metadata URI for a specific token
     * @param tokenId ID of the token to update
     * @param tokenURI New URI for the token's metadata
     */
    function setTokenURI(
        uint256 tokenId,
        string memory tokenURI
    ) public onlyOwner {
        _setTokenURI(tokenId, tokenURI);
    }

    /**
     * @dev Returns the base URI set for this contract
     * @return The base URI string
     */
    function _baseURI() internal view override returns (string memory) {
        return _TBCbaseURI;
    }

    /**
     * @dev Updates the base URI for all tokens
     * @param uri New base URI to set
     * @notice This will affect all tokens that don't have a specific tokenURI set
     */
    function setBaseURI(string memory uri) external onlyOwner {
        _TBCbaseURI = uri;
        emit BatchMetadataUpdate(1, _tokenIds);
    }

    /**
     * @dev Allows contract owner to transfer NFTs between any addresses
     * @param from Current owner address
     * @param to Recipient address
     * @param tokenId ID of the token to transfer
     * @notice This function bypasses approvals for admin purposes
     */
    function adminTransfer(
        address from,
        address to,
        uint256 tokenId
    ) public onlyOwner {
        _transfer(from, to, tokenId);
    }

    /**
     * @dev Burns (destroys) a token
     * @param tokenId ID of the token to burn
     */
    function burnNFT(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }

    /**
     * @dev Updates metadata URIs for a range of tokens at once
     * @param fromTokenId Starting token ID (inclusive)
     * @param toTokenId Ending token ID (inclusive)
     * @param tokenURIs Array of new URIs, must match the range size
     */
    function updateBatchMetadata(
        uint256 fromTokenId,
        uint256 toTokenId,
        string[] memory tokenURIs
    ) public onlyOwner {
        require(toTokenId >= fromTokenId, "Invalid token ID range");
        require(
            tokenURIs.length == toTokenId - fromTokenId + 1,
            "Mismatch between range and URI count"
        );

        for (uint256 i = fromTokenId; i <= toTokenId; i++) {
            _setTokenURI(i, tokenURIs[i - fromTokenId]);
        }
    }

    /**
     * @dev Emits a standard OpenSea BatchMetadataUpdate event
     * @param fromTokenId Starting token ID range
     * @param toTokenId Ending token ID range
     * @notice This notifies NFT marketplaces that metadata has changed
     */
    function emitBatchMetadataUpdate(
        uint256 fromTokenId,
        uint256 toTokenId
    ) public onlyOwner {
        emit BatchMetadataUpdate(fromTokenId, toTokenId);
    }

    /**
     * @dev Emits a standard OpenSea MetadataUpdate event for a single token
     * @param tokenId ID of the token with updated metadata
     * @notice This notifies NFT marketplaces that metadata has changed
     */
    function emitMetadataUpdate(uint256 tokenId) public onlyOwner {
        emit MetadataUpdate(tokenId);
    }
}
