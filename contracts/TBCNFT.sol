// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TBCNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    string private _TBCbaseURI;

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner,
        string memory baseURI
    ) ERC721(name, symbol) Ownable(initialOwner) {
        _tokenIds = 0;
        _TBCbaseURI = baseURI;
    }

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

    function setTokenURI(
        uint256 tokenId,
        string memory tokenURI
    ) public onlyOwner {
        _setTokenURI(tokenId, tokenURI);
    }

    function _baseURI() internal view override returns (string memory) {
        return _TBCbaseURI;
    }

    function setBaseURI(string memory uri) external onlyOwner {
        _TBCbaseURI = uri;
        emit BatchMetadataUpdate(1, _tokenIds);
    }

    function adminTransfer(
        address from,
        address to,
        uint256 tokenId
    ) public onlyOwner {
        _transfer(from, to, tokenId);
    }

    function burnNFT(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }

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

    function emitBatchMetadataUpdate(
        uint256 fromTokenId,
        uint256 toTokenId
    ) public onlyOwner {
        emit BatchMetadataUpdate(fromTokenId, toTokenId);
    }

    function emitMetadataUpdate(uint256 tokenId) public onlyOwner {
        emit MetadataUpdate(tokenId);
    }
}
