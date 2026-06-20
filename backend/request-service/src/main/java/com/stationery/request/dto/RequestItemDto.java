package com.stationery.request.dto;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import com.stationery.request.entity.RequestStatus;

public class RequestItemDto {
    private Long id;
    private RequestStatus status;
    @NotNull(message = "Item ID is required")
    private Long itemId;
    @NotNull(message = "Quantity is required")
    @Min(1)
    private Integer quantity;

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }
}

